# Vercel Deployment Setup

## Files Created/Modified for Vercel:

1. **vercel.json** - Main Vercel configuration
2. **api/index.py** - Python serverless function entry point
3. **.vercelignore** - Files to exclude from deployment
4. **requirements.txt** - Python dependencies for Vercel
5. **package.json** - Added `vercel-build` script
6. **vite.config.js** - Added build output directory

## Important Notes:

### Data Storage Limitation
⚠️ **The ChromaDB data in `/Data` folder will not persist in Vercel's serverless environment.**

For production deployment, you'll need to:

1. **Use an external vector database**:
   - Pinecone (recommended for production)
   - Weaviate Cloud
   - Qdrant Cloud
   - Chroma hosted service

2. **Or use Vercel's storage options**:
   - Vercel KV (for metadata)
   - Vercel Blob (for file storage)
   - External database like PostgreSQL with pgvector

### Environment Variables
You may need to set these in Vercel dashboard:
- Database connection strings
- API keys
- Model paths

### Memory Limits
Vercel free tier has memory limits that may affect:
- Large ML models
- Vector similarity calculations
- Concurrent requests

## Deployment Steps:
1. Push to GitHub
2. Connect GitHub repo to Vercel
3. Vercel will automatically detect configuration
4. Add any required environment variables
5. Deploy!

## Local Development:
Use `npm run dev` and `python backend_api.py` as before.