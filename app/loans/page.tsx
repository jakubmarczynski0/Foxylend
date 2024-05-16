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
import { Search } from "lucide-react"

import useContract from "@/hooks/useContract"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const currentDate = new Date()
const milliseconds = currentDate.getTime() / 1000
console.log(milliseconds)

export default function Loan() {
  const [loanData, setLoanData] = useState([])
  const [interestData, setInterestData] = useState([])
  const [isNFTLoading, setIsNFTLoading] = useState(true)
  const [statisticLoading, setStatisticLoading] = useState(true)
  const { signingCosmWasmClient: signingClient } = useSigningCosmWasmClient()
  const { createExecuteMessage } = useContract()

  const { connectedWallet, accounts } = useWallet()
  const { cosmWasmClient: queryClient } = useCosmWasmClient()
  const [selectedItems, setSelectedItems] = useState<
    Array<{ id: number; kind: string; title: string; selected: boolean }>
  >([])

  const handleRevoke = async (offer_id: number, index: number) => {
    let transactions: MsgExecuteContractEncodeObject[] = []

    transactions = [
      createExecuteMessage({
        senderAddress: accounts[0]?.address,
        contractAddress: process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
        message: {
          repay: { offer_id: offer_id },
        },
        funds: [{ denom: "usei", amount: interestData[index] }],
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
        //       kind: item.slice(3),
        //       title: item.slice(3),
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

  const fetchLoanData = async () => {
    const response = await queryClient?.queryContractSmart(
      process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
      {
        get_offer_by_borrower: {
          borrower: accounts[0]?.address,
        },
      }
    )
    return response?.offer_info
  }

  const getInterestData = async (collection_address: string, price: number) => {
    const response = await queryClient?.queryContractSmart(
      process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
      {
        get_reward: {
          collection_address: collection_address,
          amount: price.toString(),
        },
      }
    )
    return response
  }

  useEffect(() => {
    console.log(accounts)
    if (connectedWallet && queryClient) {
      if (accounts[0]?.address) {
        fetchLoanData().then((res) => {
          if (res?.length > 0) {
            // console.log(res[0]?.floor, "twilight-0117")
            setLoanData(res)
            // setOfferData(res)
          }
        })
      }
    }
  }, [accounts, connectedWallet, queryClient])

  useEffect(() => {
    if (loanData?.length > 0) {
      let _interestData = []
      let promises = loanData.map((item: any) => {
        return getInterestData(item.collection_address, parseInt(item.price))
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
  }, [loanData])

  return (
    <section className="px-16 pb-3 pt-6">
      <h1 className="mx-auto mb-5 text-left font-inria text-4xl text-custom sm:text-5xl md:text-6xl lg:text-7xl">
        MY LOANS
      </h1>
      {/* <div className="flex items-center gap-3">
        <Search color="white" />
        <Input
          placeholder="Search Collections"
          className=" border-0 bg-transparent text-white focus:border-0"
        />
      </div> */}
      <Separator className="mb-2 border" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Collection</TableHead>
            <TableHead className="w-[12%] text-right">Borrowed</TableHead>
            <TableHead className="w-[12%] text-center">Term</TableHead>
            <TableHead className="w-[12%] text-right">Repayment</TableHead>
            <TableHead className="w-[20%] text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loanData.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Image
                    src={foxCollectionIcon}
                    height={50}
                    width={50}
                    alt="sei"
                  />
                  {}
                </div>
              </TableCell>
              <TableCell className="font-medium ">
                <div className="flex items-center justify-end gap-2 text-right">
                  <Image src={seiWhiteIcon} alt="sei" />
                  {(item as any)?.price / 1000000}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {Math.ceil(
                  ((item as any)?.expires_at - milliseconds) / (3600 * 24)
                )}
                D
              </TableCell>
              <TableCell className="text-center ">
                <div className="flex flex-col items-end">
                  {/* <div className="flex items-center justify-end gap-2 text-center text-lg font-bold text-[#76FF6A]">
                    <Image src={seiWhiteIcon} alt="sei" />
                    {item.repayment}
                  </div> */}
                  <div className="flex flex-col items-center text-[10px]">
                    <div className="flex items-center">
                      {(interestData[index] / 1000000).toFixed(3)}
                      <Image src={seiWhiteIcon} alt="sei" className="m-[1px]" />
                    </div>
                    in interest
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">
                <Button
                  className="whitespace-nowrap px-6 py-2 text-lg font-bold md:text-xl"
                  variant={"gray"}
                  onClick={() => {
                    handleRevoke((item as any)?.offer_id, index)
                  }}
                >
                  Repay
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
