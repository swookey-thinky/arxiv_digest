import argparse
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import requests
import os
import smtplib


def get_arxiv_link(hf_url):
    response = requests.get(hf_url)
    if response.status_code != 200:
        raise Exception(
            f"Failed to fetch the Hugging Face page: {response.status_code}"
        )

    # Parse the Hugging Face page
    soup = BeautifulSoup(response.text, "html.parser")
    for link in soup.find_all("a", href=True):
        if "arxiv.org" in link["href"]:
            return link["href"]
    raise Exception(f"No arXiv link found on the page: {hf_url}.")


# Function to retrieve the abstract from an arXiv paper
def get_arxiv_abstract(arxiv_url):
    response = requests.get(arxiv_url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch the arXiv page: {response.status_code}")

    # Parse the arXiv abstract page
    soup = BeautifulSoup(response.text, "html.parser")
    abstract_tag = soup.find("blockquote", class_="abstract")

    if abstract_tag:
        return abstract_tag.get_text(strip=True).replace("Abstract:", "").strip()
    else:
        raise Exception("Abstract not found on the arXiv page.")


def get_yesterday_papers():
    start_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    hf_url = f"https://huggingface.co/papers?date={start_date}"

    # Fetch the webpage content
    response = requests.get(hf_url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch the webpage: {response.status_code}")

    # Parse the webpage content
    soup = BeautifulSoup(response.text, "html.parser")

    # Find all paper entries
    papers = soup.find_all("article")

    # Extract paper titles and links
    paper_data = []
    for paper in papers:
        title_tag = paper.find("h3")
        link_tag = paper.find("a", href=True)

        if title_tag and link_tag:
            title = title_tag.get_text(strip=True)
            link = link_tag["href"]
            paper_data.append((title, link))

    # Grab all of the extracted papers
    extracted_papers = []
    print("Extracted Paper Titles and Links:")
    for idx, (title, link) in enumerate(paper_data, 1):
        hf_paper_url = "https://huggingface.co" + link
        arxiv_link = get_arxiv_link(hf_paper_url)
        abstract = get_arxiv_abstract(arxiv_link)
        print(f"\nAbstract:\n{abstract}")
        print(f"{idx}. Title: {title}\n   Link: {link} Arxiv Link: {arxiv_link}")
        extracted_papers.append(
            {
                "title": title,
                "summary": abstract,
                "link": arxiv_link,
            }
        )

    return extracted_papers


def send_email(papers, recipient_email: str, subject_title: str, header_title: str):
    # Get email credentials from environment variables
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")

    # Prepare the email content
    subject = f"Daily Digest: Latest {subject_title} Papers from ({(datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')})"
    body = f"<h2>Latest {header_title} Papers</h2>"

    body += f"<i>{len(papers)} papers found.</i>"
    body += f"<br>"

    if papers:
        for paper in papers:
            title = paper["title"]
            summary = paper["summary"]
            link = paper["link"]

            body += f"<p><b>{title}</b><br>Abstract: {summary}<br><a href='{link}'>Read more</a></p><hr>"
    else:
        body += "<p>No new papers found in the past day.</p>"

    # Create the email message
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    # Send the email
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        print("Email sent successfully!")
    except Exception as e:
        print("Error sending email:", e)


def main(override=None):
    """
    Main entrypoint for the standalone version of this package.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--recipient_email", type=str, required=True)
    parser.add_argument("--subject_title", type=str, required=True)
    parser.add_argument("--header_title", type=str, required=True)

    args = parser.parse_args()

    papers = get_yesterday_papers()
    send_email(
        papers,
        recipient_email=args.recipient_email,
        subject_title=args.subject_title,
        header_title=args.header_title,
    )


if __name__ == "__main__":
    main()
