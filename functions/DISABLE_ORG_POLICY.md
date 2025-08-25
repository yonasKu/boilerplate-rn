# How to Disable the "Service Account Key Creation" Restriction

**Audience:** This guide is for the Google Cloud Organization Administrator.

---

## 1. The Problem

Firebase deployments for the project `sproutbook-d0c8f` are currently failing with a `Precondition failed` error. 

This is caused by an organization-level security policy that is preventing the Firebase deployment service from creating the temporary credentials it needs to function.

- **Policy Name:** `Disable Service Account Key Creation`
- **Policy ID:** `iam.disableServiceAccountKeyCreation`

## 2. The Solution

To fix this, the policy needs to be disabled specifically for the `sproutbook-d0c8f` project. This will allow Firebase deployments to proceed without weakening the security for the rest of the organization.

## 3. Step-by-Step Instructions

Here is how to disable the policy for the project:

### Step 1: Navigate to Organization Policies

1.  Open the Google Cloud Console.
2.  In the navigation menu, go to **IAM & Admin** > **Organization Policies**.

    > **Direct Link:** [https://console.cloud.google.com/iam-admin/orgpolicies](https://console.cloud.google.com/iam-admin/orgpolicies)

### Step 2: Find the Policy

1.  In the filter box at the top of the list, search for `Disable Service Account Key Creation`.
2.  Click on the policy name when it appears in the list to open its details page.

### Step 3: Edit the Policy for the Project

1.  On the policy details page, click the **EDIT** button.
2.  You will be taken to the "Edit policy" screen. Select the **Customize** option.
3.  Click **ADD RULE**.
4.  Under **Enforcement**, select the **Off** option.

    ![Set Enforcement to Off](https://storage.googleapis.com/agent-ux-screenshots/org-policy-enforcement-off.png)

### Step 4: Target the Project

1.  The rule you just created needs to be applied only to the `sproutbook-d0c8f` project.
2.  Under the **Target** section for your new rule, click **ADD SCOPE**.
3.  In the scope settings, select **Project** and enter the project ID: `sproutbook-d0c8f`.

### Step 5: Save the Changes

1.  Click the **SAVE** button to apply the new policy rule.

---

## 4. Final Result

After saving, the organization policy will no longer block key creation for the `sproutbook-d0c8f` project, and Firebase deployments will succeed. The policy will remain active for all other projects in the organization.
