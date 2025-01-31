[Previous content truncated for brevity...]

#### Option A: Using an existing LaunchDarkly client (Recommended)
If your application already has a LaunchDarkly client set up, you can pass it to the LDProvider to avoid creating multiple instances. This is the recommended approach as it ensures all flag evaluations are properly tracked through a single client instance.

Important Note: When using Option A, your application must handle SDK log level changes:

```typescript
import { withLDProvider, basicLogger } from 'launchdarkly-react-client-sdk';
import { LDProvider } from 'launchdarkly-react-logger';

function App() {
  // Track your LaunchDarkly client with state
  const [client, setClient] = useState(() => {
    // Initial client setup with stored or default level
    const storedLevel = localStorage.getItem('ld_sdk_log_level');
    const logLevel = (storedLevel && ['error', 'warn', 'info', 'debug'].includes(storedLevel))
      ? storedLevel
      : 'info';

    return withLDProvider({
      clientSideID: 'your-client-id',
      context: yourContexts,
      options: {
        logger: basicLogger({ level: logLevel })
      }
    })(YourComponent);
  });

  // Handle SDK log level changes
  const handleLogLevelChange = async (value) => {
    if (['error', 'warn', 'info', 'debug'].includes(value)) {
      const ldClient = client._client;
      
      // Close current client
      await ldClient.close();
      
      // Create new client with updated log level
      const newClient = withLDProvider({
        clientSideID: 'your-client-id',
        context: yourContexts,
        options: {
          logger: basicLogger({ level: value })
        }
      })(YourComponent);
      
      // Update your application's client reference
      setClient(newClient);
    }
  };
  
  return (
    <LDProvider 
      existingClient={client}
      onLogLevelChange={handleLogLevelChange}
      onReady={() => console.log('LaunchDarkly logger initialized')}
      loadingComponent={<div>Loading...</div>}
    >
      <YourApp />
    </LDProvider>
  );
}
```

This setup ensures:
1. Your application starts with the stored log level (or 'info' as default)
2. When the SDK log level flag changes:
   - The LDProvider tracks the evaluation in analytics
   - Your application receives the new level via onLogLevelChange
   - Your application closes the current client
   - Your application creates a new client with the updated level
3. The change takes effect immediately since you control the client lifecycle

#### Option B: Creating a new LaunchDarkly client
If you don't have an existing LaunchDarkly client, the LDProvider can create and manage one for you:

```typescript
import { LDProvider } from 'launchdarkly-react-logger';
import { createContexts } from './contexts';

function App() {
  return (
    <LDProvider 
      clientSideId="your-client-id"
      createContexts={createContexts}
      onReady={() => console.log('LaunchDarkly initialized')}
      loadingComponent={<div>Loading LaunchDarkly...</div>}
    >
      <YourApp />
    </LDProvider>
  );
}
```

With Option B:
1. The LDProvider handles the complete lifecycle:
   - Creates client with stored level (or 'info' default)
   - Tracks flag evaluations
   - Handles client reinitialization when flag changes
2. You don't need to implement any SDK log level handling
3. Changes take effect immediately

[Rest of README content remains the same...]
