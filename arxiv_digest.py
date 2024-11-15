import argparse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import os
import requests
import smtplib
import xml.etree.ElementTree as ET

LANGUAGE_MODELING_SEARCH_QUERY = '(cat:cs.CL OR cat:cs.AI) AND (abs:"language model" OR abs:"LLM" OR abs:"large language model" OR abs:"small language model")'
DIFFUSION_MODELING_SEARCH_QUERY = '(cat:cs.CL OR cat:cs.AI) AND (abs:"diffusion model")'


def get_yesterday_papers(search_query: str):
    # Define the base URL for the arXiv API
    base_url = "http://export.arxiv.org/api/query?"

    # Define the search terms and other query parameters
    start_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%dT00:00:00Z")

    # Combine query with date filter
    query = f"{base_url}search_query={search_query}&start=0&max_results=100&sortBy=submittedDate&sortOrder=descending"

    # Send the request to arXiv
    response = requests.get(query)
    if response.status_code != 200:
        print(f"Error fetching data from arXiv: {response.status_code}")
        return []

    # Parse the XML response
    root = ET.fromstring(response.content)
    papers = []
    for entry in root.findall("{http://www.w3.org/2005/Atom}entry"):
        title = entry.find("{http://www.w3.org/2005/Atom}title").text
        summary = entry.find("{http://www.w3.org/2005/Atom}summary").text
        published = entry.find("{http://www.w3.org/2005/Atom}published").text
        link = entry.find("{http://www.w3.org/2005/Atom}id").text

        # Filter to include only papers published in the last 24 hours
        if published >= start_date:
            papers.append(
                {
                    "title": title,
                    "summary": summary,
                    "published": published,
                    "link": link,
                }
            )

    return papers


def send_email(papers, recipient_email: str, subject_title: str, header_title: str):
    # Get email credentials from environment variables
    sender_email = os.getenv("SENDER_EMAIL")
    sender_password = os.getenv("SENDER_PASSWORD")

    # Prepare the email content
    subject = f"Daily Digest: Latest {subject_title} Papers on arXiv ({datetime.now().strftime('%Y-%m-%d')})"
    body = f"<h2>Latest {header_title} Papers from arXiv</h2>"

    body += f"<i>{len(papers)} papers found.</i>"
    body += f"<br>"

    if papers:
        for paper in papers:
            title = paper["title"]
            summary = paper["summary"]
            published = paper["published"]
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
    parser.add_argument("--search_query", type=str, required=True)

    args = parser.parse_args()

    papers = get_yesterday_papers(search_query=args.search_query)
    send_email(
        papers,
        recipient_email=args.recipient_email,
        subject_title=args.subject_title,
        header_title=args.header_title,
    )


if __name__ == "__main__":
    main()
