"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import foxCollectionIcon from "@/public/nft/fox_collection.png"
import seiWhiteIcon from "@/public/sei-white.svg"
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate"
import { Separator } from "@radix-ui/react-separator"
import {
  useCosmWasmClient,
  useSigningCosmWasmClient,
  useWallet,
} from "@sei-js/react"
import axios from "axios"

import useContract from "@/hooks/useContract"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Offer() {
  const [totalStaked, setTotalStaked] = useState(0)
  const [totalClaimedPoints, setTotalClaimedPoints] = useState(0)
  const [lendFetchData, setLendData] = useState([])
  const [offerData, setOfferData] = useState([])
  const { connectedWallet, accounts } = useWallet()
  const [interestData, setInterestData] = useState([])
  const { cosmWasmClient: queryClient } = useCosmWasmClient()
  const { signingCosmWasmClient: signingClient } = useSigningCosmWasmClient()
  const [selectedItems, setSelectedItems] = useState<
    Array<{ id: number; kind: string; title: string; selected: boolean }>
  >([])
  const { createExecuteMessage } = useContract()

  const fetchOfferData = async () => {
    const response = await queryClient?.queryContractSmart(
      process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
      {
        get_offer_by_creator: { creator: accounts[0]?.address, limit: 30 },
      }
    )
    console.log(response)
    return response?.offer_info
  }
  const fetchLendData = async () => {
    const response = await axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND}/lend/collection_info`)
      .then((res) => res.data)
      .catch((error) => console.log("error", error))

    return response?.collections_info
  }

  const getInterestData = async (collection_address: string, price: number) => {
    console.log(collection_address, price)
    const response = await queryClient?.queryContractSmart(
      process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
      {
        get_reward: {
          collection_address: collection_address,
          amount: price.toString(),
        },
      }
    )
    console.log(response)
    return response
  }

  const handleRevoke = async (offer_id: number) => {
    let transactions: MsgExecuteContractEncodeObject[] = []

    transactions = [
      createExecuteMessage({
        senderAddress: accounts[0]?.address,
        contractAddress: process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
        message: {
          cancel_offer: { offer_id: offer_id },
        },
      }),
    ]

    if (!transactions.length) {
      alert("Sorry☹️, failed lending!")
      return
    }
    const fee = {
      amount: [{ amount: "0.1", denom: "usei" }],
      gas: "700000",
    }
    signingClient
      ?.signAndBroadcast(accounts[0]?.address, transactions, fee)
      .then((res) => {
        if (res.code !== 0) {
          throw new Error(res.rawLog)
        }
        alert("Succeed in claiming. Good👍Luck!!")
      })
      .catch((e) => {
        console.log("debug error", e, typeof e)
        alert("Sorry☹️, failed betting!!")
      })
      .finally(() => {
        console.log("refetch")
        // fetchUnsteikCount().then((res: Array<string>) => {
        //   if (res?.length != 0) {
        //     const fetchedItems = res?.map((item: string, index: number) => ({
        //       id: index,
        //       kind: (item as any)?.slice(3),
        //       title: (item as any)?.slice(3),
        //       selected: false,
        //     }))
        //     console.log(fetchedItems, "fetchedItems----")
        //     setSelectedItems(fetchedItems)
        //   }
        //   if (res?.length === 0) {
        //     setSelectedItems([])
        //   }
        // })
      })
  }

  useEffect(() => {
    if (accounts[0]?.address) {
      fetchOfferData().then((res) => {
        if (res?.length > 0) {
          // console.log(res[0]?.floor, "twilight-0117")
          setOfferData(res)
        }
      })
    }
  }, [accounts, queryClient])

  useEffect(() => {
    if (connectedWallet && queryClient) {
      fetchLendData().then((res) => {
        if (res?.length != 0) {
          const fetchedItems = res?.map((item: any, index: number) => ({
            apy: parseFloat((item as any)?.collection_info.apy) * 100,
            duration: (item as any)?.collection_info.limit_time,
          }))
          console.log(fetchedItems, "fetchedItems----")
          setLendData(fetchedItems)
        }
      })
    }
    if (!connectedWallet) {
      setLendData([])
    }
    // setStatisticLoading(true)
    // fetchStatistic().then((res: any) => {
    //   if (res?.length != 0) {
    //     setTotalStaked(parseInt(res?.total_staked))
    //     setTotalClaimedPoints(parseInt(res?.total_claimed_points) / 1000000)
    //     setStatisticLoading(false)
    //   }
    // })
  }, [accounts, connectedWallet, queryClient])

  useEffect(() => {
    if (offerData?.length > 0) {
      let _interestData = []
      let promises = offerData.map((item: any) => {
        return getInterestData(
          (item as any)?.collection_address,
          parseInt((item as any)?.price)
        )
      })
      Promise.all(promises)
        .then((results) => {
          _interestData = results
          console.log(_interestData, "123123")
          setInterestData(_interestData as never)
          // You can now use _interestData here or do any further processing
        })
        .catch((error) => {
          // Handle any errors that occurred during the fetching process
        })
    }
  }, [offerData])

  return (
    <section className="px-16 pb-3 pt-6">
      <h1 className="mx-auto mb-5 text-left font-inria text-4xl text-custom sm:text-5xl md:text-6xl lg:text-7xl">
        MY OFFERS
      </h1>
      {/* <div className="flex items-center gap-3">
        <Search color="white" />
        <Input
          placeholder="Search Collections"
          className=" border-0 bg-transparent text-white focus:border-0"
        />
      </div>
      <Separator className="mb-2 border" /> */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Collection</TableHead>
            <TableHead className="w-[12%] text-right">Offer</TableHead>
            <TableHead className="w-[12%] text-right">Interest</TableHead>
            <TableHead className="w-[12%] text-center">APY</TableHead>
            <TableHead className="w-[12%] text-center">Status</TableHead>
            <TableHead className="w-[20%] text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offerData.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Image
                    src={foxCollectionIcon}
                    height={50}
                    width={50}
                    alt="sei"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium ">
                <div className="flex items-center justify-end gap-2 text-right">
                  <Image src={seiWhiteIcon} alt="sei" />
                  {(item as any)?.price / 1000000}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                <div className="flex items-center justify-end gap-2 text-right">
                  <Image src={seiWhiteIcon} alt="sei" />
                  {(interestData[index] - (item as any)?.price) / 1000000}
                </div>
              </TableCell>
              <TableCell className="text-center text-lg font-bold text-[#76FF6A]">
                {(lendFetchData[index] as any)?.apy}%
              </TableCell>
              <TableCell className="text-center font-medium">
                {(item as any)?.status === "not_accepted"
                  ? "Seeking borrowers"
                  : "Accepted"}
              </TableCell>
              <TableCell className="text-center font-medium">
                <Button
                  className="whitespace-nowrap px-6 py-2 text-lg font-bold md:text-xl"
                  variant={"red"}
                  disabled={!((item as any)?.status === "not_accepted")}
                  onClick={() => {
                    handleRevoke((item as any)?.offer_id)
                  }}
                >
                  Revoke
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
