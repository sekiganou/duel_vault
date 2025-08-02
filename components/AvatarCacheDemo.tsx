import React, { useEffect, useState } from "react";
import { avatarCacheAPI } from "@/lib/api/avatarCacheAPI";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";

/**
 * Demo component showing how to use the Avatar Cache API
 */
export const AvatarCacheDemo: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [testFilename, setTestFilename] = useState("");
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load cache stats on mount
  useEffect(() => {
    updateCacheStats();
  }, []);

  const updateCacheStats = () => {
    setCacheStats(avatarCacheAPI.getCacheStats());
  };

  const handleGetPresignedUrl = async () => {
    if (!testFilename) return;

    setLoading(true);
    try {
      const url = await avatarCacheAPI.getPresignedUrl(testFilename);
      setPresignedUrl(url);
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  const handleRefreshUrl = async () => {
    if (!testFilename) return;

    setLoading(true);
    try {
      const url = await avatarCacheAPI.refreshPresignedUrl(testFilename);
      setPresignedUrl(url);
    } finally {
      setLoading(false);
      updateCacheStats();
    }
  };

  const handleClearExpired = () => {
    const cleared = avatarCacheAPI.clearExpired();
    alert(`Cleared ${cleared} expired entries`);
    updateCacheStats();
  };

  const handleClearAll = () => {
    avatarCacheAPI.clearAll();
    setPresignedUrl(null);
    updateCacheStats();
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Avatar Cache API Demo</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Cache Stats */}
          <div>
            <h4 className="font-medium mb-2">Cache Statistics</h4>
            {cacheStats && (
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(cacheStats, null, 2)}
              </pre>
            )}
          </div>

          {/* Test URL Generation */}
          <div>
            <h4 className="font-medium mb-2">Test Avatar URL Generation</h4>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Enter avatar filename (e.g., uuid-image.jpg)"
                value={testFilename}
                onChange={(e) => setTestFilename(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <Button
                onClick={handleGetPresignedUrl}
                disabled={loading || !testFilename}
                color="primary"
                size="sm"
              >
                Get URL
              </Button>
              <Button
                onClick={handleRefreshUrl}
                disabled={loading || !testFilename}
                color="secondary"
                size="sm"
              >
                Refresh
              </Button>
            </div>

            {presignedUrl && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Generated URL:</p>
                <div className="bg-gray-100 p-2 rounded text-xs break-all">
                  {presignedUrl}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cached: {avatarCacheAPI.isCached(testFilename) ? "Yes" : "No"}
                </p>
              </div>
            )}
          </div>

          {/* Cache Management */}
          <div>
            <h4 className="font-medium mb-2">Cache Management</h4>
            <div className="flex gap-2">
              <Button onClick={handleClearExpired} color="warning" size="sm">
                Clear Expired
              </Button>
              <Button onClick={handleClearAll} color="danger" size="sm">
                Clear All
              </Button>
              <Button onClick={updateCacheStats} color="default" size="sm">
                Refresh Stats
              </Button>
            </div>
          </div>

          {/* Usage Examples */}
          <div>
            <h4 className="font-medium mb-2">Usage Examples</h4>
            <div className="text-sm space-y-2">
              <div>
                <strong>Single avatar:</strong>
                <code className="block bg-gray-100 p-1 rounded text-xs mt-1">
                  {`const url = await avatarCacheAPI.getPresignedUrl('filename.jpg');`}
                </code>
              </div>
              <div>
                <strong>Multiple avatars:</strong>
                <code className="block bg-gray-100 p-1 rounded text-xs mt-1">
                  {`const urls = await avatarCacheAPI.getBulkPresignedUrls(['file1.jpg', 'file2.jpg']);`}
                </code>
              </div>
              <div>
                <strong>Process deck objects:</strong>
                <code className="block bg-gray-100 p-1 rounded text-xs mt-1">
                  {`const processedDecks = await avatarCacheAPI.processDecksAvatars(decks);`}
                </code>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
