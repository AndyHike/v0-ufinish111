// Test script to fetch orders from RemOnline API and check data structure
const REMONLINE_API_KEY = process.env.REMONLINE_API_KEY || "412d16da5c5e4c8c964fee5d440dbf7e"

async function testRemOnlineAPI() {
  console.log("🚀 Testing RemOnline API...")

  try {
    // Test 1: Get orders
    console.log("\n📋 Testing orders endpoint...")
    const ordersResponse = await fetch("https://api.remonline.app/orders?limit=5", {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${REMONLINE_API_KEY}`,
      },
    })

    const ordersData = await ordersResponse.json()
    console.log("Orders response:", JSON.stringify(ordersData, null, 2))

    if (ordersData.data && ordersData.data.length > 0) {
      const firstOrder = ordersData.data[0]
      console.log("\n📋 First order structure:")
      console.log("Order ID:", firstOrder.id)
      console.log("Order name:", firstOrder.name)
      console.log("Device brand:", firstOrder.asset?.brand)
      console.log("Device model:", firstOrder.asset?.model)
      console.log("Status ID:", firstOrder.status?.id)
      console.log("Client ID:", firstOrder.client?.id)

      // Test 2: Get order items
      console.log(`\n🔧 Testing order items for order ${firstOrder.id}...`)
      const itemsResponse = await fetch(`https://api.remonline.app/orders/${firstOrder.id}/items`, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${REMONLINE_API_KEY}`,
        },
      })

      const itemsData = await itemsResponse.json()
      console.log("Order items response:", JSON.stringify(itemsData, null, 2))

      if (itemsData.length > 0) {
        const firstItem = itemsData[0]
        console.log("\n🔧 First item structure:")
        console.log("Item ID:", firstItem.id)
        console.log("Service name:", firstItem.entity?.title)
        console.log("Price:", firstItem.price)
        console.log("Quantity:", firstItem.quantity)
        console.log("Warranty:", firstItem.warranty)
      }
    }

    // Test 3: Get order statuses
    console.log("\n📊 Testing order statuses endpoint...")
    const statusesResponse = await fetch("https://api.remonline.app/statuses/orders", {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${REMONLINE_API_KEY}`,
      },
    })

    const statusesData = await statusesResponse.json()
    console.log("Statuses response:", JSON.stringify(statusesData, null, 2))
  } catch (error) {
    console.error("❌ Error testing RemOnline API:", error)
  }
}

// Run the test
testRemOnlineAPI()
