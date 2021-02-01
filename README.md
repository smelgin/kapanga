# Salesforce Order Products Management

![orders-logo](onlineorderfulfillment_sml.png)


1. Set up your environment. Follow the steps in the Quick Start: Lightning Web Components Trailhead project. The steps include:

   * Enable Dev Hub in your Trailhead Playground
   * Install Salesforce CLI
   * Install Visual Studio Code
   * Install the Visual Studio Code Salesforce extensions, including the Lightning Web Components extension

2. If you haven't already done so, authorize your hub org and provide it with an alias (myhuborg in the command below):
```
sfdx auth:web:login -d -a myhuborg
```

3. Clone the kapanga repository
```
git clone https://github.com/smelgin/kapanga
cd kapanga
```
4. Create a scratch org and provide it with an alias (kapanga in the command below):
```
sfdx force:org:create -s -f config/project-scratch-def.json -a kapanga
```
## Import sample data
This is a little bit more complex task since there is no way to use the "tree" option in sfdx to import many-to-many relationships like the one between `Product2` and `Pricebook2`. So please, follow the next recipe to import data to your brand new scratch-org.

1. Import Account and Contacts related:
```
sfdx force:data:tree:import --targetusername test-wvkpnfm5z113@example.com \
 --plan data/export-demo-Account-Contact-plan.json
```

2. Import Products
```
sfdx force:data:bulk:upsert -s Product2 -f data/products.csv -i PRD_P01_Id__c
```

3. Import Pricebook entries:
This step will require a little more work:

 3.a. Open your scratch org and go to app KPN, and then to Pricebooks, and open "Standard Price Book".

 3.b. Look into the URL, it should be like this: `https://<your scratch org prefix>.lightning.force.com/lightning/r/Pricebook2/<pricebookId>/view`

 3.c. Copy the `<pricebookId>` and save or paste it in some other place for future references.

 3.d. Export as Csv, Product2 records, using Salesforce Data Loader (only Id and ProductCode, ordered by ProductCode).

 3.e. Open with some spreadsheets app (maybe Excel or LibreOffice), the file "pricebook_entries_standard.csv".

 3.f. Replace the id in the column "Pricebook2Id" by the one you pasted in step d (on each row).

 3.g. Replace each row in column 2, by the Id obtained in step e.
 

 4. Import "pricebook_entries_standard.csv" using DataLoader.

 5. Open the scratch org:
 ```
 sfdx force:org:open --targetusername <your-scratch-org-username@example.com>
 ```

 4. Manually create a Contract in the scratch org. Please activate the contract.
 
 5. Manually create an order in the scratch org. Once you created, you'll access the functionality.
 

## References

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
