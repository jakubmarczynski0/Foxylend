export const fetchFloorData = async () => {
  try {
    const response = await fetch(
      `https://api.pallet.exchange/api/v2/collections/stats?lookback=10000000000000&pageSize=100&addresses=${process.env.NEXT_PUBLIC_NFT_ADDRESS}`
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching statistics:", error)
    // Handle the error according to your needs
  }
}
