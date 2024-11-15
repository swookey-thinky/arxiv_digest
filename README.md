# Arxiv Digest

A simple cronjob to email myself nightly summaries of interesting Arxiv publications. I am interested in two main areas right now, diffusion modeling and language modeling,
so the script is setup to query for any relevant papers published in the last day based on those keywords. It uses the Arxiv query API to do the searching, and emails myself a digest of the results
every night - the cronjob is setup to run every night at midnight. The nightly email will look something like:

![Email Digest Sample](https://drive.google.com/uc?export=view&id=1w10VO7LO2c8e5pi9xaeFCnW38AeLzD0j)

# How to run

Clone the repository. Remember where you put it. From the terminal, type:

```
> crontab -e
```

In the cronjob window, add the following line, which creates a cronjob the run the scripts above, which consist of a bash script to setup environment variables
and a python script to query the arxiv API:

```
```

For example, here is my language modeling script invocation (make sure to replace `<email address>` with your own):

```
python arxiv_digest.py --recipient_email <email address> --subject_title LLM --header_title "Language Modeling (T)" --search_query '(cat:cs.CL OR cat:cs.AI) AND (abs:"language model" OR abs:"LLM" OR abs:"large language model" OR abs:"small language model")'
```
