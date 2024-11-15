# Arxiv Digest

A simple cronjob to email myself nightly summaries of interesting Arxiv publications. I am interested in two main areas right now, diffusion modeling and language modeling,
so the script is setup to query for any relevant papers published in the last day based on those keywords. It uses the Arxiv query API to do the searching, and emails myself a digest of the results
every night - the cronjob is setup to run every night at midnight. The nightly email will look something like:

![Email Digest Sample](https://drive.google.com/uc?export=view&id=1w10VO7LO2c8e5pi9xaeFCnW38AeLzD0j)

There are two scripts in the package.

**arxiv_digest.py**: This is the main python script that queries the arxiv API, parses the results, and sends the email.
**arxiv_digest.sh**: This is a helper script that is called from the cron job, and mainly just creates a temporary python environment to run the `arxiv_digest.py` script.

## Requirements

The script uses your personal gmail account to send the email - I haven't tried with anything other than gmail. In order to do this, you need to have an app password created for your gmail account - the script connects to a Google SMTP and authenticates with your gmail address and this app password. Note this is *different* than your account password. Follow the directions [here](https://support.google.com/mail/answer/185833?hl=en) to create an app password for your gmail account, or go directly to your account [here](https://myaccount.google.com/apppasswords) to create one.

## How to run

First clone the repository. In order to make sure everything is setup properly (you have the correct app password and search query), you can run the `arxiv_digest.sh` script directly. Here is an example invocation, which will send you all of the relevant language modeling papers from the last day, to make sure everything is setup properly:

```
> git clone https://github.com/swookey-thinky/arxiv_digest.git
> cd arxiv_digest
> ./arxiv_digest.sh --python_script_path arxiv_digest.py --recipient_email <recipient email> --subject_title LLM --header_title "Language Modeling" --search_query '(cat:cs.CL OR cat:cs.AI) AND (abs:"language model" OR abs:"LLM" OR abs:"large language model" OR abs:"small language model")' --sender_email <sender email> --sender_password <sender app password>
```
If successful, you should have a nice new email in your Inbox! If not, well, good luck debugging. Post issues here and I can help you out, or hit me up on twitter.

The script itself takes the following arguments:

**python_script_path**: This is the full path to the `arxiv_digest.py` script. It's used to make sure the cronjob can find the right script to run.
**recipient_email**: This is the email address where you will send the digest. Please make sure this is your email address, let's not spam any random people.
**sender_email**: This is the email address that will be used to send the email digest to the recipient. You will need to own credentials for this address to make sure it works.
**sender_password**: This is the app password for the `sender_email` account. This is used to authenticate to the SMTP server to send the email digest.
**subject_title**: A short title to appear in the email subject line. The subject line will be formatted as: `Daily Digest: Latest {subject_title} Papers on arXiv {date}`.
**header_title**: The header of the email body. Can be the same as the `subject_title`. Will be formatted as: `Latest {header_title} Papers from arXiv`.
**search_query**: This is the query to use in the arxiv API. I have put two example queries below, one for language modeling and one for diffusion modeling.

### Sample Search Queries

| Query | Description
| ----- | -----
| '(cat:cs.CL OR cat:cs.AI) AND (abs:"language model" OR abs:"LLM" OR abs:"large language model" OR abs:"small language model")' | Queries for papers related to language modeling.
| '(cat:cs.CL OR cat:cs.AI) AND (abs:"diffusion model")' | Queries for papers related to diffusion modeling.

### Setting up the Cronjob

Now, to setup the cronjob, remember the directory where you cloned the repository. You should do this from a machine that is always on, since if the machine is not always on (like yur laptop) the cronjob won't run at the right times. From the terminal, type:

```
> crontab -e
```

In the cronjob window, add the following line, which creates a task the run the scripts above:

```
```

For example, here is my language modeling script invocation (make sure to replace `<email address>` with your own):

```
python arxiv_digest.py --recipient_email <email address> --subject_title LLM --header_title "Language Modeling (T)" --search_query '(cat:cs.CL OR cat:cs.AI) AND (abs:"language model" OR abs:"LLM" OR abs:"large language model" OR abs:"small language model")'
```
