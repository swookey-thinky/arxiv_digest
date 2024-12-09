from bs4 import BeautifulSoup as bs
from dataclasses import dataclass
import datetime
from google.cloud import firestore
import json
import openai_utils
import os
import pytz
import re
import time
import tqdm
from typing import List
import urllib.request

from google.cloud import firestore
from dataclasses import dataclass
from typing import List


RELEVANCY_PROMPT = """
You have been asked to read a list of a few arxiv papers, each with title, authors and abstract.
Based on my specific research interests, relevancy score out of 10 for each paper, based on my specific research interest, with a higher score indicating greater relevance. A relevance score more than 7 will need person's attention for details.
Additionally, please generate 1-2 sentence summary for each paper explaining why it's relevant to my research interests.
Please keep the paper order the same as in the input list, with one json format per line. Example is:
1. {"Relevancy score": "an integer score out of 10", "Reasons for match": "1-2 sentence short reasonings"}

My research interests are:
"""


@dataclass
class Topic:
    id: str
    subtopics: List[str]


@dataclass
class Digest:
    name: str
    topics: List[Topic]
    interests: str


@dataclass
class User:
    id: str
    digests: List[Digest]


@dataclass
class DigestResult:
    relevancy_score: int
    reason: str
    arxiv_id: str


def parse_topics(all_topics: str) -> List[Topic]:
    topics = []

    for topic in all_topics.strip().split(","):
        t = topic.strip().split(".")
        topics.append(Topic(id=t[0], subtopics=[t[1]]))

    topics = merge_topics(topics)
    return topics


def merge_topics(topics: List[Topic]) -> List[Topic]:
    """
    Merge Topic entries based on similar ids.

    Args:
        topics (List[Topic]): List of Topic instances to merge.

    Returns:
        List[Topic]: A list of merged Topic instances.
    """
    merged_topics = {}

    for topic in topics:
        if topic.id in merged_topics:
            merged_topics[topic.id].subtopics.extend(topic.subtopics)
        else:
            merged_topics[topic.id] = Topic(
                id=topic.id, subtopics=list(topic.subtopics)
            )

    # Remove duplicate subtopics
    for topic in merged_topics.values():
        topic.subtopics = list(set(topic.subtopics))

    return list(merged_topics.values())


def fetch_all_users() -> List[User]:
    db = firestore.Client()
    digests_ref = db.collection("digests")
    digests = digests_ref.stream()

    # First, group digests by user_id
    user_digests: dict[str, List[Digest]] = {}
    for digest_doc in digests:
        digest_data = digest_doc.to_dict()
        user_id = digest_data.get("userId")
        if not user_id:
            continue

        digest = Digest(
            name=digest_data.get("name", ""),
            topics=parse_topics(digest_data.get("topics", "")),
            interests=digest_data.get("description", ""),
        )

        if user_id not in user_digests:
            user_digests[user_id] = []
        user_digests[user_id].append(digest)

    # Convert the dictionary to List[User]
    users = [
        User(id=user_id, digests=digests) for user_id, digests in user_digests.items()
    ]

    return users


def extract_categories_from_users(users: List[User]) -> List[str]:
    categories = set()

    for user in users:
        for digest in user.digests:
            for topic in digest.topics:
                categories.add(topic.id)
    return categories


def _download_new_papers(field_abbr):
    NEW_SUB_URL = (
        f"https://arxiv.org/list/{field_abbr}/new"  # https://arxiv.org/list/cs/new
    )
    page = urllib.request.urlopen(NEW_SUB_URL)
    soup = bs(page, features="lxml")
    content = soup.body.find("div", {"id": "content"})

    # find the first h3 element in content
    h3 = content.find("h3").text  # e.g: New submissions for Wed, 10 May 23
    date = h3.replace("New submissions for", "").strip()

    dt_list = content.dl.find_all("dt")
    dd_list = content.dl.find_all("dd")
    arxiv_base = "https://arxiv.org/abs/"

    assert len(dt_list) == len(dd_list)
    new_paper_list = []
    for i in tqdm.tqdm(range(len(dt_list)), leave=False):
        paper = {}

        paper_number_entries = dt_list[i].text.strip().split(" ")
        paper_number = None
        for ent in paper_number_entries:
            if ent.strip().lower().startswith("arxiv:"):
                paper_number = ent.strip().split(":")[-1]
                break
        assert paper_number, paper_number_entries

        paper["main_page"] = arxiv_base + paper_number
        paper["pdf"] = arxiv_base.replace("abs", "pdf") + paper_number

        paper["title"] = (
            dd_list[i]
            .find("div", {"class": "list-title mathjax"})
            .text.replace("Title: ", "")
            .strip()
        )
        paper["authors"] = (
            dd_list[i]
            .find("div", {"class": "list-authors"})
            .text.replace("Authors:\n", "")
            .replace("\n", "")
            .strip()
        )
        paper["subjects"] = (
            dd_list[i]
            .find("div", {"class": "list-subjects"})
            .text.replace("Subjects: ", "")
            .strip()
        )
        paper["abstract"] = (
            dd_list[i].find("p", {"class": "mathjax"}).text.replace("\n", " ").strip()
        )
        new_paper_list.append(paper)

    #  check if ./data exist, if not, create it
    if not os.path.exists("./data"):
        os.makedirs("./data")

    # save new_paper_list to a jsonl file, with each line as the element of a dictionary
    date = datetime.date.fromtimestamp(
        datetime.datetime.now(tz=pytz.timezone("America/New_York")).timestamp()
    )
    date = date.strftime("%a, %d %b %y")
    with open(f"./data/{field_abbr}_{date}.jsonl", "w") as f:
        for paper in new_paper_list:
            f.write(json.dumps(paper) + "\n")


def get_papers(field_abbr, date, limit=None):
    date = date.strftime("%a, %d %b %y")
    if not os.path.exists(f"./data/{field_abbr}_{date}.jsonl"):
        _download_new_papers(field_abbr)
    results = []
    with open(f"./data/{field_abbr}_{date}.jsonl", "r") as f:
        for i, line in enumerate(f.readlines()):
            if limit and i == limit:
                return results
            results.append(json.loads(line))
    print(f"Retrieved {len(results)} papers for category '{field_abbr}'")
    return results


def process_subject_fields(subjects):
    all_subjects = subjects.split(";")
    all_subjects = [s.split(" (")[0] for s in all_subjects]
    return all_subjects


def has_subject_fields(query, subjects):
    for q in query:
        if q in subjects:
            return True
    return False


def encode_prompt(query, prompt_papers):
    """Encode multiple prompt instructions into a single string."""
    prompt = RELEVANCY_PROMPT + "\n"
    prompt += query["interest"]
    prompt += "\nThe papers are: \n"

    for idx, task_dict in enumerate(prompt_papers):
        (title, authors, abstract) = (
            task_dict["title"],
            task_dict["authors"],
            task_dict["abstract"],
        )
        if not title:
            raise
        prompt += f"###\n"
        prompt += f"{idx + 1}. Title: {title}\n"
        prompt += f"{idx + 1}. Authors: {authors}\n"
        prompt += f"{idx + 1}. Abstract: {abstract}\n"
    prompt += f"\n Generate response:\n1."
    print(prompt)
    return prompt


def post_process_chat_gpt_response(paper_data, response, threshold_score=8):
    selected_data = []
    if response is None:
        return []
    json_items = response.message.content.replace("\n\n", "\n").split("\n")
    pattern = r"^\d+\. |\\"
    import pprint

    try:
        score_items = [
            json.loads(re.sub(pattern, "", line))
            for line in json_items
            if "relevancy score" in line.lower()
        ]
    except Exception:
        pprint.pprint(
            [
                re.sub(pattern, "", line)
                for line in json_items
                if "relevancy score" in line.lower()
            ]
        )
        raise RuntimeError("failed")
    # pprint.pprint(score_items)
    scores = []
    for item in score_items:
        temp = item["Relevancy score"]
        if isinstance(temp, str) and "/" in temp:
            scores.append(int(temp.split("/")[0]))
        else:
            scores.append(int(temp))
    if len(score_items) != len(paper_data):
        score_items = score_items[: len(paper_data)]
        hallucination = True
    else:
        hallucination = False

    for idx, inst in enumerate(score_items):
        # if the decoding stops due to length, the last example is likely truncated so we discard it
        if scores[idx] < threshold_score:
            continue
        output_str = "Title: " + paper_data[idx]["title"] + "\n"
        output_str += "Authors: " + paper_data[idx]["authors"] + "\n"
        output_str += "Link: " + paper_data[idx]["main_page"] + "\n"
        for key, value in inst.items():
            paper_data[idx][key] = value
            output_str += str(key) + ": " + str(value) + "\n"
        paper_data[idx]["summarized_text"] = output_str
        selected_data.append(paper_data[idx])
    return selected_data, hallucination


def generate_relevance_score(
    all_papers,
    query,
    model_name="gpt-3.5-turbo-16k",
    threshold_score=8,
    num_paper_in_prompt=4,
    temperature=0.4,
    top_p=1.0,
    sorting=True,
):
    ans_data = []
    request_idx = 1
    hallucination = False
    for id in tqdm.tqdm(range(0, len(all_papers), num_paper_in_prompt)):
        prompt_papers = all_papers[id : id + num_paper_in_prompt]
        # only sampling from the seed tasks
        prompt = encode_prompt(query, prompt_papers)

        decoding_args = openai_utils.OpenAIDecodingArguments(
            temperature=temperature,
            n=1,
            max_tokens=128
            * num_paper_in_prompt,  # The response for each paper should be less than 128 tokens.
            top_p=top_p,
        )
        request_start = time.time()
        response = openai_utils.openai_completion(
            prompts=prompt,
            model_name=model_name,
            batch_size=1,
            decoding_args=decoding_args,
            logit_bias={
                "100257": -100
            },  # prevent the <|endoftext|> from being generated
        )

        request_duration = time.time() - request_start

        process_start = time.time()
        batch_data, hallu = post_process_chat_gpt_response(
            prompt_papers, response, threshold_score=threshold_score
        )
        hallucination = hallucination or hallu
        ans_data.extend(batch_data)

        print(f"Request {request_idx+1} took {request_duration:.2f}s")
        print(f"Post-processing took {time.time() - process_start:.2f}s")

    if sorting:
        ans_data = sorted(
            ans_data, key=lambda x: int(x["Relevancy score"]), reverse=True
        )

    return ans_data, hallucination


def query_papers_for_category(
    query={
        "interest": "1. Diffusion models for content creation, including image, video and audio diffusion models for generating images, audio including speech and music, and long and short form videos 2. Highlight other, non-diffusion papers related to media audio, image, or video generation 3. Prioritize papers that come out of large research labs like Google and OpenAI 4. Prioritize papers that are open weight models, or open source with a github repository 5. Not interested in papers that focus on specific languages, e.g. Arabic, Chinese, etc.",
        "subjects": ["cs.AI", "cs.CV"],
    },
    date: str = None,
    data_dir="data",
    model_name="gpt-3.5-turbo-16k",
    threshold_score=8,
    num_paper_in_prompt=8,
    temperature=0.4,
    top_p=1.0,
):
    if date is None:
        date = datetime.datetime.today().strftime("%a, %d %b %y")
        # string format such as Wed, 10 May 23
    print("the date for the arxiv data is: ", date)

    all_papers = [json.loads(l) for l in open(f"{data_dir}/{date}.jsonl", "r")]
    print(f"We found {len(all_papers)}.")

    all_papers_in_subjects = [
        t for t in all_papers if has_subject_fields(query["subjects"], t["subjects"])
    ]
    print(
        f"After filtering subjects, we have {len(all_papers_in_subjects)} papers left."
    )
    ans_data, hallucination = generate_relevance_score(
        all_papers_in_subjects,
        query,
        model_name,
        threshold_score,
        num_paper_in_prompt,
        temperature,
        top_p,
    )
    return ans_data


def write_daily_digest_results(
    user_id: str,
    digest_results: List[DigestResult],
    result_date: datetime.datetime,
    digest_name: str,
):
    """
    Writes a list of DigestResult instances to the Firestore collection "daily_digest_results" for a given user ID and date.

    Args:
        user_id (str): The user ID to associate the digest results with.
        digest_results (List[DigestResult]): List of DigestResult instances to write.
        result_date (date): The date associated with the digest results.
        digest_name (str): The name of the digest for grouping results.
    """
    # Initialize Firestore client
    db = firestore.Client()

    # Format the date as "YYYY-MM-DD"
    formatted_date = result_date.strftime("%Y-%m-%d")

    # Reference to the user's daily digest results collection by date and name
    user_digest_collection = (
        db.collection("daily_digest_results")
        .document(user_id)
        .collection(formatted_date)
        .document(digest_name)
        .collection("results")
    )

    try:
        # Write each DigestResult to Firestore
        for digest_result in digest_results:
            user_digest_collection.add(
                {
                    "relevancy_score": digest_result.relevancy_score,
                    "reason": digest_result.reason,
                    "arxiv_id": digest_result.arxiv_id,
                }
            )
        print(
            f"Successfully wrote {len(digest_results)} digest results for user {user_id} on {formatted_date} under digest name '{digest_name}'."
        )

    except Exception as e:
        print(f"An error occurred while writing digest results: {e}")


def generate_digests_for_user(user: User, date: datetime.datetime):
    for digest in user.digests:
        generate_digest_for_user_and_topic(userId=user.id, digest=digest, date=date)


def generate_digest_for_user_and_topic(
    userId: str, digest: Digest, date: datetime.datetime
):
    # For each category, generate the relevancy scores
    all_relevancy_scores = []
    date_str = date.strftime("%a, %d %b %y")

    for topic in digest.topics:
        subjects = []
        for subtopic in topic.subtopics:
            subjects.append(f"{topic.id}.{subtopic}")
        relevancy_scores = query_papers_for_category(
            query={"interest": digest.interests, "subjects": subjects},
            date=f"{topic.id}_{date_str}",
        )
        all_relevancy_scores.extend(relevancy_scores)

    # Sort by relevance across all topics
    all_relevancy_scores = sorted(
        all_relevancy_scores, key=lambda x: int(x["Relevancy score"]), reverse=True
    )

    # This returns all papers with a threshold score >= 8.
    print(f"Found {len(all_relevancy_scores)} papers for user {userId}.")

    # The important fields for the relevancy scores are:
    #
    # "Relevancy score": Integer score of the relevance to the query
    # "Reasons for match": Textual description of the reasons for matching
    # "main_page": The URL to the arxiv abstract
    #
    # Write the relevancy results back to the firestore database for this user.
    digest_results = []
    for score in all_relevancy_scores:
        digest_results.append(
            DigestResult(
                relevancy_score=score["Relevancy score"],
                reason=score["Reasons for match"],
                arxiv_id=score["main_page"].strip().split("/")[-1],
            )
        )
    write_daily_digest_results(
        user_id=userId,
        digest_results=digest_results,
        result_date=date,
        digest_name=digest.name,
    )


def main(args_override=None):
    # First fetch all of the users that have a digest defined
    all_users = fetch_all_users()

    # Extract all of the topic categories that we need to download for today
    categories = extract_categories_from_users(all_users)
    print(f"Downloading data for categories: {categories}...")

    # Grab all of the papers for the given categories. This will just download
    # the metadata to disk.
    date = datetime.date.fromtimestamp(
        datetime.datetime.now(tz=pytz.timezone("America/New_York")).timestamp()
    )

    for category in tqdm.tqdm(categories, desc="Downloading papers"):
        get_papers(field_abbr=category, date=date)

    # For each user, generate a relevancy score for each of the papers.
    for user in all_users:
        generate_digests_for_user(user=user, date=date)


if __name__ == "__main__":
    main()
