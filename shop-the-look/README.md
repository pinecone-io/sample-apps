# 👘  Shop The Look 

## A multimodal search engine for finding your new favorite outfit

https://github.com/user-attachments/assets/8a0f7d34-0768-4ea3-a21f-48ab93635a1e

## 📔 Table of Contents

- [💃🏻 Overview](#-overview)
- [💡 Features](#-features)
- [🔧 Setup & Installation](#-setup--installation)
  - [Demo Deployment](#%EF%B8%8F-demo-deployment-2-minutes)
  - [Full Deployment](#%EF%B8%8F-full-deployment-30-minutes)
- [🌉 Use Your Own Images and Videos](#-use-your-own-images-and-videos-20-minutes)
- [🫠 Troubleshooting](#-troubleshooting)
- [⚠️ Service Limitations](#%EF%B8%8F-service-limitations)
- [📝 Contributing](#-contributing)
- [🔮 Built With](#-built-with)

## 💃🏻 Overview

Shop The Look is a multimodal search engine for finding outfit inspiration built using Pinecone Serverless, Google's Multimodal Embedding Model, and assets from Pexels. 

This sample application is a great starting point for you to build your own multimodal search engine for your use cases. Clone it, run it locally or deploy it to Vercel, and customize it to make it your own.

![image](https://github.com/user-attachments/assets/31dff4bd-f56b-4f08-8998-7a6e1aa3ca7b)

## 💡 Features

- **Multimodal Search**: Combines text, image, and video inputs to provide highly relevant outfit recommendations.
- **Pinecone Serverless Integration**: Uses Pinecone Serverless vector database for efficient and scalable multimodal search. 
- **Google Cloud Vertex AI**: Leverages Google's [Multimodal Embedding Model](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings) for accurate and high-quality embeddings of text, images, and videos.
- **Vercel Deployment**: Easily deploy the application to Vercel in a few clicks.
- **Customizable**: Modify both NextJS frontend and Python FastAPI backend components to fit your specific use cases, such as e-commerce, product showcase, or personal image and video search.
- **Extensive Asset Library**: Demo app includes over 45,000 royalty-free images and videos from Pexels, pre-embedded and upserted for immediate use.
- **Convenient Scripts**: Includes scripts to easily upload your own images and videos for your own use cases.

## 🔧 Setup & Installation

We offer two installation methods for Shop The Look:

1. [Demo Deployment](#%EF%B8%8F-demo-deployment-2-minutes) - quick setup for demo purposes
3. [Full Deployment](#%EF%B8%8F-full-deployment-30-minutes) - bring your own images and videos + full setup

#### Not sure which installation method to use? 

![installation-flowchart](https://github.com/user-attachments/assets/a3229ff1-7ec8-4d88-ac36-9ddb3284c4b1)

## ☁️ Demo Deployment (2 minutes)

*Note: The demo deployment is for **demonstration purposes only**.*

For developers who want to quickly deploy and test the Shop The Look application without setting up their own backend services or supply their own image/video assets, we offer a demo deployment option that includes over 45,000 royalty-free images and videos. This method allows you to deploy the front-end locally, while utilizing our hosted backend API (which we have set up with all assets, Pinecone Serverless index, and Google Cloud Vertex AI).

### Benefits
- No need to set up Pinecone or Google Cloud accounts
- Contains over 45,000 royalty-free image and video assets embedded, upserted, and uploaded
- Faster deployment process
- For testing and exploration (not for production)

### Prerequisites
- Node.js (v14 or later)
- npm or yarn

### 💻 Local Demo Deployment

#### One-click deployment (15 seconds)

```bash
npx create-pinecone-app@latest --template shop-the-look
```

Then, open [http://localhost:3000](http://localhost:3000) in your browser.

## ☀️ Full Deployment (30 minutes)

For developers who want to deploy a fully customizable Shop The Look application with their own images and videos, we offer a full deployment option. This method requires setting up both the frontend and backend components, including Pinecone Serverless, Google Cloud Vertex AI, and Google Cloud Storage, and uploading your own images and videos.

### Benefits
- Adaptable to use cases beyond outfit recommendation (e.g., product showcase, e-commerce, interior design, personal image and video search, etc)
- Use your own images and videos
- Modify frontend and backend logic and services to meet your use cases
- Production-ready

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Python 3.8 or later
- A Google Cloud account
- A Pinecone account
- A Vercel account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pinecone-io/sample-apps.git
   cd sample-apps/shop-the-look
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Setup API Keys

In order to deploy the full Shop The Look sample app, you need to setup the following services. Shop The Look ***will not work*** without these services. 

<details>
<summary>
<h4>Google Cloud Setup</h4>
</summary>

Google Cloud setup allows you to use Vertex AI, a machine learning platform that allows you to embed your images and videos using Google's Multimodal Embedding Model. This will also allow you to upload your images and videos to Google Cloud Storage.

1. Create a new project in the [Google Cloud Console](https://console.cloud.google.com/).

2. Enable the following APIs for your project:
   - Vertex AI API
   - Cloud Storage API

![image](https://github.com/user-attachments/assets/8c7cb8d5-16f2-40f5-8070-63b8d0f2d025)

![image](https://github.com/user-attachments/assets/d6470b77-748c-4fb3-9382-9c3e798f7ef6)

![image](https://github.com/user-attachments/assets/9ecf7c8e-6640-4e4b-817c-84993d921f8e)

3. Create a service account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and grant it the following roles:
     - Vertex AI User
     - Storage Object Viewer

![image](https://github.com/user-attachments/assets/a51d8524-b9a7-463e-82aa-08d7dad6ed36)

![image](https://github.com/user-attachments/assets/1c00b14b-c846-4fe7-9c92-8320a306b8fd)

![image](https://github.com/user-attachments/assets/e9c4a251-2c4d-4760-9c40-ef10cf9d2aa0)

4. Generate a JSON key for the service account:
   - Click on the service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format and download the key file. Save this somewhere safe. 

![image](https://github.com/user-attachments/assets/a24df002-12df-4678-aa91-4f1f3de25c25)

![image](https://github.com/user-attachments/assets/5116b69b-8eb8-4fc8-bba6-883d144a3b03)

5. Encode the JSON key file to base64:
   ```bash
   base64 -i path/to/your-key-file.json | tr -d '\n' > google-credentials-base64.txt
   ```

6. Save the base64-encoded key, we will be using this in the [Environment Variables](#environment-variables) section. 

7. *Optional:* To run the Google Cloud Vertex AI SDK locally (for testing purposes), follow the gcloud CLI authentication setup instructions [here](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings#prereqs). 
</details>

<details>
<summary>
<h4>Pinecone Setup</h4>
</summary>

This step allows you to use Pinecone Serverless, our very own serverless vector database service, to upsert the multimodal embeddings to Pinecone.

1. Sign up for a [Pinecone account](https://www.pinecone.io/?utm_source=shop-the-look&utm_medium=referral).
2. Create a new Pinecone Serverless Index with the following settings:
   1. Dimensions: `1408` (for Google's Multimodal Embedding Model)
   2. Metric: `cosine`
   3. Choose your cloud provider of choice
   4. Choose your region of choice
  
   ![image](https://github.com/user-attachments/assets/3eb70b3c-cacd-404f-8b2f-64db8f6a5846)

3. Note down your Pinecone API key, you will need this to connect to your Pinecone index.

![image](https://github.com/user-attachments/assets/71536814-5f2e-41f5-be67-8dc6c3ed30c5)

</details>

### 💻 Local Full Deployment (5 minutes)

#### Environment Variables

1. Modify `.env.development.example` **(in the root directory of this repository)** and change name to `.env.development`:

2. Update the Google Cloud settings:

   ```env.development
   GOOGLE_CLOUD_PROJECT_ID=[your-google-cloud-project-id]
   GOOGLE_CLOUD_PROJECT_LOCATION=[your-region]
   GOOGLE_CLOUD_STORAGE_BUCKET_NAME=[your-gcs-bucket-name]
   ```

   - Set `GOOGLE_CLOUD_PROJECT_ID` to your own Google Cloud project ID, this looks something like `shop-the-look`, and is in the top-left corner of your Google Cloud dashboard. 
   - Set `GOOGLE_CLOUD_PROJECT_LOCATION` to the region where your Google Cloud resources are located.
   - Set `GOOGLE_CLOUD_STORAGE_BUCKET_NAME` to the name of your Google Cloud Storage (GCS) bucket. Instructions on how to setup and upload your assets to Google Cloud Storage: [Image and Video Embedding Processors README](https://github.com/pinecone-io/sample-apps-internal/blob/main/shop-the-look/scripts/README.md).

3. Set up the Google credentials:

   ```env.development
   GOOGLE_CREDENTIALS_BASE64=[your-base64-encoded-google-credentials]
   ```

   - Ensure `GOOGLE_CREDENTIALS_BASE64` environment variable is set with your own base64-encoded service account JSON, instructions are [here](https://github.com/pinecone-io/sample-apps-internal/blob/main/shop-the-look/README.md#google-cloud-setup).

4. Update the Pinecone settings:

   ```env.development
   PINECONE_API_KEY=[your-pinecone-api-key]
   PINECONE_INDEX_NAME=[your-pinecone-index-name]
   PINECONE_TOP_K=20  # or any other value you prefer
   ```

   - Set `PINECONE_API_KEY` to your own Pinecone API key, instructions are [here](https://github.com/pinecone-io/sample-apps-internal/blob/main/shop-the-look/README.md#pinecone-setup).
   - Set `PINECONE_INDEX_NAME` to the name of your Pinecone index.
   - *Optional: adjust `PINECONE_TOP_K` value to change the number of top results returned by your search.*

5. Save the above environment variables to your shell configuration file (`.bashrc`, `.zshrc`, or any other `rc` file you use). Alternatively, you can set these environment variables manually in [your shell](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-linux).

#### Deploy

1. Start the backend & frontend server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

3. *Optional*: The backend API server is available at [http://localhost:8000/api/](http://localhost:8000/api/), send your REST requests to this endpoint to interact with the backend API.

### 🚀 Vercel Full Deployment (5 minutes)

We have made it incredibly easy to deploy Shop The Look to [Vercel](https://vercel.com/), a popular cloud platform for building and deploying web applications.

#### Deploying to Vercel

1. Log in to your Vercel account and click "New Project".

   ![image](https://github.com/user-attachments/assets/ec560eff-a7e7-4058-a689-b916b546be1f)

3. Import this repository [`git@github.com:pinecone-io/sample-apps.git`](https://github.com/pinecone-io/sample-apps.git) using "Import Third-Party Git Repository"

   ![image](https://github.com/user-attachments/assets/b65edf09-57c4-4c43-93b4-c71ae6a4e428)
   ![image](https://github.com/user-attachments/assets/0f795b9e-f194-4cf1-899c-3413956dd8a9)

5. Connect Vercel project to our Sample Apps Github repo

   ![image](https://github.com/user-attachments/assets/e6630818-449a-4619-af3c-dca2c1b9408c)

7. Set up "Root Directory" to use `shop-the-look` (***this step is important***)

   ![image](https://github.com/user-attachments/assets/db65c0ab-9d43-42d5-948b-b4993b54b031)

8. Set up environment variables in the Vercel project settings:
   - Go to your project on the Vercel dashboard
   - Navigate to **Settings** -> **Environment Variables**
   - Add the following variables:

   ```
   GOOGLE_CLOUD_PROJECT_ID=[your-google-cloud-project-id]
   GOOGLE_CLOUD_PROJECT_LOCATION=[your-region]
   GOOGLE_CLOUD_STORAGE_BUCKET_NAME=[your-gcs-bucket-name]
   GOOGLE_CREDENTIALS_BASE64=[your-base64-encoded-google-credentials]

   PINECONE_API_KEY=[your-pinecone-api-key]
   PINECONE_INDEX_NAME=[your-pinecone-index-name]
   PINECONE_TOP_K=20
   ```

   ![image](https://github.com/user-attachments/assets/307b712d-db0b-41b1-ba10-25b8adaebace)

9. Redeploy your project to apply the environment variables.

10. Your Shop The Look application should now be redeployed and accessible, but without assets.

11. Upload your own images and videos. Follow the instructions in the next section. 

## 🌉 Use Your Own Images and Videos (20 minutes)

In order to make Shop The Look your own, you need to **upload your own images and videos**. 

Open the [Image and Video Embedding Processors](https://github.com/pinecone-io/sample-apps/blob/main/shop-the-look/scripts/README.md) guide (located at [`scripts/README.md`](https://github.com/pinecone-io/sample-apps/blob/main/shop-the-look/scripts/README.md)) and follow the instructions. 

## 🫠 Troubleshooting

For **Google Cloud** authentication or permission issues, ensure that:
- The service account has the correct permissions - `Vertex AI User`, `Storage Object Viewer`
- The `GOOGLE_CREDENTIALS_BASE64` environment variable is correctly set, double check in your shell or Vercel environment variables. 
- The environment variables are set. Save the environment variables to your shell configuration file (`.bashrc`, `.zshrc`, or any other `rc` file you use), or set these environment variables manually in [your shell](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-linux).
- The Google Cloud APIs are enabled for your project - `Vertex AI API`, `Cloud Storage API`
- Make sure you have [setup Google Authentication for Shop The Look](https://github.com/pinecone-io/sample-apps-internal/blob/main/shop-the-look/README.md#google-cloud-setup) correctly
- [Official Google Cloud Authentication Guide](https://cloud.google.com/docs/authentication/getting-started)

For **Pinecone** issues, verify that:
- You entered the right Index name
- Your API key is correct
- The Index is created with the correct dimensions (1408)
- The environment variables are set. Save the environment variables to your shell configuration file (`.bashrc`, `.zshrc`, or any other `rc` file you use), or set these environment variables manually in [your shell](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-linux).
- Make sure you have [setup Pinecone for Shop The Look](https://github.com/pinecone-io/sample-apps-internal/blob/main/shop-the-look/README.md#pinecone-setup) correctly
- [Official Pinecone Documentation](https://www.pinecone.io/docs?utm_source=shop-the-look&utm_medium=referral)

For **Vercel** deployment issues, check:
- [Vercel build logs](https://vercel.com/docs/deployments/logs)
- Ensure all [environment variables](https://vercel.com/docs/projects/environment-variables) are correctly set in the Vercel project settings
- Ensure you set your project's **Settings** -> **Root Directory** to use `shop-the-look`, otherwise it would try to deploy the entire Sample App monorepo which would fail

For **other** issues, please create an issue in the [GitHub repository](https://github.com/pinecone-io/sample-apps/issues).

## ⚠️ Service Limitations

There are some service limitations to be aware of. 

#### Affects Frontend
- Vercel's request body size limit of 4.5 MB, so all image and video uploads in the frontend (this is the drag-and-drop upload and upload button) is limited to <4.5 MB ([source](https://vercel.com/docs/storage/vercel-blob/server-upload)). Users will not be able to upload images or videos larger than 4.5 MB in Shop The Look. To alleviate this, we apply client-side image compression to images prior to uploading. Videos are not compressed. 

#### Affects Backend
- Multimodal Embedding Model using videos hosted on Google Cloud Storage has no maximum video length, but only 2 minutes of content will be analyzed at a time ([source](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings#api-limits)) 
- Multimodal Embedding Model image upload is limited to 20 MB, and the image is resized to 512x512 pixels prior to embedding ([source](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings#api-limits))
- Some users may encounter authentication issues with the Google Cloud SDK when getting embeddings for videos stored in Google Cloud Storage using `gs://` URIs. These issues will appear as `StatusCode.UNAUTHENTICATED` and `Video embedding failed with the following error: Deadline` errors. This is a known issue with the Google Cloud SDK, and a potential solution can be found in this [Stack Overflow thread](https://stackoverflow.com/a/78618078/1913389). If this does not fix your issue, you will need to provide the video as a base64-encoded byte string (`video.bytesBase64Encoded`) - further instructions found [here](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings#vid-embedding).
- Multimodal Embedding Model base64-encoded string video upload is limited to 27,000,000 chars ([not documented](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings#api-limits), but you will error) 
- Vercel Python Serverless Functions cannot exceed 250 MB in size ([source](https://vercel.com/docs/functions/limitations#vercel-functions-limitations)), so if you use a large Python library like `vertex-ai`, you will error. You will need to query Vertex AI's REST API directly, like in [/api/v1/endpoints](https://github.com/pinecone-io/sample-apps/tree/main/shop-the-look/api/v1/endpoints)
- When extending the FastAPI backend, requests need to be mapped to `/api/:path*/` as this uses `next.config.js` rewrites. More information in the [Next.js FastAPI](https://github.com/digitros/nextjs-fastapi) Starter from Vercel. ([source](https://vercel.com/docs/functions/limitations#vercel-functions-limitations))

## 📝 Contributing

Any useful contributions are welcome, please create a [pull request](https://github.com/pinecone-io/sample-apps/pulls) or [issue](https://github.com/pinecone-io/sample-apps/issues). 

## 🔮 Built With

- [Pinecone Serverless](https://www.pinecone.io/?utm_source=shop-the-look&utm_medium=referral)
- [Google Cloud Vertex AI Multimodal Embedding Library](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings)
- [Google Cloud Storage](https://cloud.google.com/storage?hl=en)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
- [Pexels](https://www.pexels.com/)
