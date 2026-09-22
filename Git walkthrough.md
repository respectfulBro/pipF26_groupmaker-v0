# Git walkthrough (Class 2)

Most common issues:
1. you are in the wrong directory. Git commands only work inside a repo folder — `cd` into `pipF26_groupmaker-v0` first and use `pwd` to check.
2. not reading what git printed. Git usually tells you the exact next command to run (it will suggest `git add`, `git push --set-upstream`, etc.). Read the message before retyping.
3. If you get stuck, try copy-pasting or screenshotting the last few lines of the terminal text into your AI (Cursor's chat or ChatGPT) and describe what you are trying to do.

Notation:
`>>` indicates that you should enter the following text in your terminal window
`()` after a command below indicates a note. You should not include this in your command in the terminal.
`[]` indicates that this is a swappable value. For example `[your-username]` means your actual GitHub username, and `[my-notes]` is a branch name you could swap for any name you like.

One idea before any commands: **git makes save points** of your code on your machine. **GitHub keeps a copy** of those save points online. Everything below is either "make a save point" or "sync with the online copy."

## One-time: make the repo

Last week you cloned `pipF26_groupmaker-v0` from my GitHub account. You can pull from my copy, but you can't save to it. One command re-points your folder at your own copy.

On github.com: **+ → New repository** → name it `pipF26_groupmaker-v0` → Public → **do NOT check any of the "initialize" boxes** (no README, no .gitignore) → Create.

```
>> cd [pipF26_groupmaker-v0] (the folder you cloned last week)
>> git remote -v (shows where "origin" points — my account, for now)
>> git remote add origin https://github.com/[your-username]/pipF26_groupmaker-v0.git (you should see this link on GitHub after creation)
>> git remote -v (now points at yours)
>> git push -u origin main (first push may open a browser window to log in to GitHub — do it)
```

Refresh your repo page on github.com — the entire app is now under your account. This is the copy your agent builds on tonight.

## In-class exercise check: the working loop

```
>> git status (should say "nothing to commit, working tree clean")
>> git checkout -b [my-notes] (create a branch and switch to it — a separate line of save points, so main stays safe)

```

In Cursor, open `README.md` and add one line at the bottom: your name and today's date. Save the file.

```
>> git status (README.md shows in red — changed, but not part of the next save point yet)
>> git add README.md (stage it — "include this in the next save point")
>> git status (README.md now green)
>> git commit -m "add my name to readme" (the save point is made with notes for yourself on others on what changed)
>> git log --oneline (your commit is the top line of the repo's history)
>> git push -u origin [my-notes] (send the branch to GitHub)
```

On github.com, refresh your repo: a yellow banner offers to open a pull request from your branch. **Leave it alone** — that's the partner exercise next.

One more thing branches buy you:

```
>> git checkout main (look at README.md — your line is GONE. Not lost: it lives on the branch)
>> git switch [my-notes] (and it's back) (switch = checkout for switching between branches)
```

## .gitignore — why your secrets never reach GitHub

Open the file named `.gitignore` in the repo. Find the line that says `.env`.

Now create a file named `.env` (using Cursor or a text editor) in the repo folder containing one line: `FAKE_SECRET=hello`. Save it.

```
>> git status (nothing. git refuses to even see the file, because .gitignore told it to)
```

API keys and passwords go in `.env`, and `.env` is listed in `.gitignore`, so it can never be committed by accident. This matters because GitHub history is forever — a secret you commit and then delete is still in the history, and bots scrape GitHub for exactly that.

## Commits are checkpoints

The checkpoint concept has been part of professional software engineering for awhile as backup and as a team coordination mechanism. It is even more crucial with AI so that when you let a coding agent alter your code directly, you can rollback to a previous version if you do not like the result rather than trying to debug potentially thousands of changes made by a bot.

**Commit early and often**

```
>> git checkout main (leave yourself on main for the next exercise)
```
