"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function TestRemonlinePage() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [searchType, setSearchType] = useState<"email" | "phone">("email")
  const [searchIdentifier, setSearchIdentifier] = useState("")
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [searchResult, setSearchResult] = useState<any>(null)

  const testConnection = async () => {
    setConnectionStatus("loading")
    try {
      const response = await fetch("/api/test-remonline")
      const data = await response.json()
      setConnectionResult(data)
      setConnectionStatus(data.success ? "success" : "error")
    } catch (error) {
      console.error("Error testing connection:", error)
      setConnectionResult({ error: String(error) })
      setConnectionStatus("error")
    }
  }

  const searchClient = async () => {
    if (!searchIdentifier) return

    setSearchStatus("loading")
    try {
      const response = await fetch(
        `/api/admin/clients/search?type=${searchType}&identifier=${encodeURIComponent(searchIdentifier)}`,
      )
      const data = await response.json()
      setSearchResult(data)
      setSearchStatus(data.success ? "success" : "error")
    } catch (error) {
      console.error("Error searching client:", error)
      setSearchResult({ error: String(error) })
      setSearchStatus("error")
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Remonline API Test</h1>

      <Alert className="mb-4">
        <AlertTitle>API Documentation</AlertTitle>
        <AlertDescription>
          <p>Make sure your Remonline API token is correctly set in the environment variables.</p>
          <p className="mt-2">
            <Link
              href="https://remonline.app/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary hover:underline"
            >
              View Remonline API Documentation <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </p>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="connection">
        <TabsList>
          <TabsTrigger value="connection">Test Connection</TabsTrigger>
          <TabsTrigger value="search">Search Client</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Remonline API Connection</CardTitle>
              <CardDescription>Test the connection to the Remonline API using your API token</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testConnection} disabled={connectionStatus === "loading"}>
                {connectionStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Connection
              </Button>

              {connectionStatus === "success" && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Successfully connected to the Remonline API
                  </AlertDescription>
                </Alert>
              )}

              {connectionStatus === "error" && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
                  <AlertDescription className="text-red-700">Failed to connect to the Remonline API</AlertDescription>
                </Alert>
              )}

              {connectionResult && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Response:</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(connectionResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Client</CardTitle>
              <CardDescription>Search for a client by email or phone number</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search-type">Search Type</Label>
                    <select
                      id="search-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value as "email" | "phone")}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="search-identifier">{searchType === "email" ? "Email" : "Phone Number"}</Label>
                    <Input
                      id="search-identifier"
                      value={searchIdentifier}
                      onChange={(e) => setSearchIdentifier(e.target.value)}
                      placeholder={searchType === "email" ? "user@example.com" : "+380123456789"}
                    />
                  </div>
                </div>

                <Button onClick={searchClient} disabled={searchStatus === "loading" || !searchIdentifier}>
                  {searchStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Client
                </Button>

                {searchStatus === "success" && (
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Search Successful</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {searchResult.exists ? "Client found" : "Client not found"}
                    </AlertDescription>
                  </Alert>
                )}

                {searchStatus === "error" && (
                  <Alert className="mt-4 bg-red-50 border-red-200">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-800">Search Failed</AlertTitle>
                    <AlertDescription className="text-red-700">Failed to search for client</AlertDescription>
                  </Alert>
                )}

                {searchResult && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Response:</h3>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                      {JSON.stringify(searchResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
