<!-- copied from "your_first_crud_app" bc it was getting too in-depth -->

## A brief background

My first serious dive into programming happened a few years ago, when I knew that my mom had a *super* tedious computer task as part of her job that took *hoouurrrsss* of her time every single week. It wasn't difficult in the least -- just really time-consuming.

Long story short, I learned enough Python to write a script that used regex and [openpyxl](https://openpyxl.readthedocs.io/en/stable/) to scrape huge and messy text documents from her work, and turn them into nice + neat spreadsheets of sales contact leads.

It was just a command-line tool and thus not so user-friendly, so later I decided to turn it into a web app.

(By the way, for those starting out: This app was developed, iteratively, over the course of a LONG time and is way more complex than a first-time app needs to be. I use this just as an example of the *kind* of thing you can do!)

My specifications:
1. The script for processing data was written in Python. I wanted to keep it in Python.
    - REQ: I need a Python backend to which I can submit requests for processing.
1. A user should be able to submit/parse arbitrarily large documents.
    - REQ: I can't use a client session for this! There is a(n easily breakable) size cap.
1. If the user accidentally leaves/refreshes the page, *they should not lose their work in progress*.
    - REQ: I need to save their work somewhere.
1. Multiple people should be able to independently use the website at any given time.
    - REQ: Each user needs to have an identifier that will show which work is theirs.

**To satisfy these requirements, I needed to deploy a database.**