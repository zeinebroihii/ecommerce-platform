@echo off
cd /d c:\Users\MSI\Desktop\Salesforces\ecommerce-platform
sf data query --query "SELECT Id, DeveloperName, IsDeleted FROM FieldDefinition WHERE EntityDefinitionId = 'TALEXO_Quote__c'" --use-tooling-api --json
