# Google Calendar Analysis

## Problems:
For some reason, logging summary (or eventsByActivityType) will cause the program to later throw an error,
even though it functions fine without printing summary to the console.

## Clasp
Setup using [this](https://medium.com/geekculture/how-to-write-google-apps-script-code-locally-in-vs-code-and-deploy-it-with-clasp-9a4273e2d018)
guide

4 Commands:
- `clasp login`
- `clasp clone`
- `clasp push` or `clasp push -w` to repeatedly push
  - Errors with unexpected errors: run `./clasp_push.sh` to fix
- `clasp pull`