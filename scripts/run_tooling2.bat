@echo off
cd /d c:\Users\MSI\Desktop\Salesforces\ecommerce-platform
sf data query --query "SELECT Id, DeveloperName, IsDeleted FROM FieldDefinition WHERE EntityDefinitionId = 'TALEXO_Quote__c'" --use-tooling-api --json > scripts\tooling_out.txt 2>&1
type scripts\tooling_out.txt
