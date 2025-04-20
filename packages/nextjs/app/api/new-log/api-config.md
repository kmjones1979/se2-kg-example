# Graph API Configuration Guide

This guide provides information on how to configure and test the connection to The Graph API for your knowledge graph application.

## API Endpoint Structure

Based on the documentation from [GitHub: graphprotocol/grc-20-ts](https://github.com/graphprotocol/grc-20-ts), the API endpoint structure for getting calldata is:

```
https://api-[network].grc-20.thegraph.com/space/[spaceId]/edit/calldata
```

Where:

- `[network]` is either `testnet` or `mainnet`
- `[spaceId]` is your specific space ID

## Common Issues and Troubleshooting

If you're experiencing 502 Bad Gateway errors or other connectivity issues, consider the following:

1. **Space ID Validity**:

   - Ensure your space ID is valid and accessible
   - Try creating a new space using the API if needed

2. **Network Access**:

   - Check if your network allows outgoing connections to these domains
   - Try from a different network if possible

3. **Authentication**:

   - The API might require authentication that's not explicitly mentioned in the basic documentation
   - Check for API key requirements or other authentication mechanisms

4. **Use Mock Data During Development**:
   - The application is configured to fall back to mock data automatically
   - This allows you to continue development while resolving API connectivity issues

## Testing Tools

This project includes several tools to help diagnose API connectivity issues:

1. **API Test Page**:

   - Visit http://localhost:3000/api/new-log to access the test utility
   - Test various endpoint structures and configurations

2. **Console Testing**:

   - From your browser console, run:

   ```javascript
   await import("/api/new-log").then(m => m.testEndpoints());
   ```

3. **Direct API Testing**:
   - Test direct API calls to various endpoints from the test page
   - Customize the endpoint URL to try different structures

## Mock Data

When using mock data, the application will use the following values:

```json
{
  "to": "0x731a10897d267e19b34503ad902d0a29173ba4b1",
  "data": "0x4554480000000000000000000000000000000000000000000000000000000000"
}
```

This allows development to continue when the API is not accessible.

## Next Steps

If none of the API endpoints work, you may need to:

1. Reach out to The Graph team for support or documentation
2. Check if there's a newer version of the SDK with updated endpoints
3. Consider implementing a more robust API configuration system with retries, circuit breaking, and fallbacks
