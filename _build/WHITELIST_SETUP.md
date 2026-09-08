# Wiring the allowlist form to a spreadsheet you can actually read

Five minutes. No third party, no monthly bill, you own the data. The form posts straight into a Google
Sheet you control.

## 1. Make the sheet

New Google Sheet, name it `NEW YORKERS allowlist`. Put these headers in row 1, in this exact order:

```
submitted_at	name	email	x_handle	discord	telegram	wallet	mint_count	is_collector	mlow_owned	notes	attest	news	ref	source
```

## 2. Add the script

In that sheet: **Extensions**, **Apps Script**. Delete whatever is there, paste this, and save.

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function (h) { return (e.parameter[h] || ''); });
  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Publish it

**Deploy**, **New deployment**, type **Web app**. Set:

- Execute as: **Me**
- Who has access: **Anyone**

Deploy, authorise when Google asks, and copy the **Web app URL**. It ends in `/exec`.

Google will warn you the app is unverified. That is normal for your own script. Click through Advanced
and continue.

## 4. Point the site at it

In `NEW YORKERS SITE/assets/config.js`:

```js
whitelistEndpoint: "https://script.google.com/macros/s/AKfy.../exec",
```

Then rebuild and redeploy:

```bash
"NEW YORKERS SITE/_build/build_all.sh"
cd "GO LIVE PACKAGE" && ./deploy.sh
```

## 5. Test it before you announce

Submit the form yourself with a junk email. A row should appear in the sheet within a second or two.
If it does not, the usual cause is "Who has access" being left on "Only myself".

Until an endpoint is set, the form refuses to submit and tells the visitor the list is not open yet.
It does not pretend to work and silently lose people.

---

## What this does not do

**It does not verify anything.** The form collects a wallet address and a checkbox saying the wallet is a
month old and holds 0.2 ETH or 10,000 dollars of art. It cannot check either from a browser, and it does
not try. Verification is a separate job you run against the chain after the snapshot:

- **Wallet age**: first outbound transaction timestamp. Etherscan API, one call per address.
- **ETH balance**: balance at the snapshot block, not today, or people top up for a day and withdraw.
- **Art holdings**: the hard one. There is no clean definition of a grail. Decide in advance whether you
  mean floor price times count on specific collections, or a manual eyeball on a shortlist. Write the rule
  down before you look at names, or you will be deciding it case by case with faces attached.

Pick the snapshot block **before you publish the criteria**, or people will farm the requirements. That is
the same failure as the free claim arbitrage in the drop architecture: a rule announced before it is
measured is a rule people can buy their way into.

## Airtable instead

If you would rather use Airtable, make a base with the same columns, create a form view, and either use
Airtable's own form or point `whitelistEndpoint` at a small proxy. The Google route is recommended only
because it is free and there is no account to maintain.
