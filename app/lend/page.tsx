"use client"

import internal from "stream"
import { useEffect, useState } from "react"
import Image from "next/image"
import foxIcon from "@/public/foxylend-logo.svg"
import seiWhiteIcon from "@/public/sei-white.svg"
import { fetchFloorData } from "@/services/common/fetchFloorData"
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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const lendData = [
  {
    collection: "Fud Foxes",
    pool: "954.54",
    offer: "98.5",
    apy: "180%",
    duration: "14D",
  },
  {
    collection: "Fud Foxes",
    pool: "8.54",
    offer: "98.5",
    apy: "180%",
    duration: "14D",
  },
  {
    collection: "Fud Foxes",
    pool: "94.54",
    offer: "98.5",
    apy: "180%",
    duration: "14D",
  },
  {
    collection: "Fud Foxes",
    pool: "8854.54",
    offer: "98.5",
    apy: "180%",
    duration: "14D",
  },
]

interface Item {
  best_offer_price: string // adjust the type as needed
  collection_info: {
    apy: string // adjust the type as needed
    limit_time: string // adjust the type as needed
  }
}

export default function Lend() {
  const [valueError, setValueError] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [balance, setBalance] = useState(0)
  const [lendFetchData, setLendData] = useState([])
  const [currentLendData, setCurrentData] = useState([])
  const [lendAmount, setLendAmount] = useState(0.0)
  const [floorData, setFloorData] = useState(0)
  const { createExecuteMessage } = useContract()
  const { connectedWallet, accounts } = useWallet()
  const { cosmWasmClient: queryClient } = useCosmWasmClient()
  const { signingCosmWasmClient: signingClient } = useSigningCosmWasmClient()
  const [selectedItems, setSelectedItems] = useState<
    Array<{ id: number; kind: string; title: string; selected: boolean }>
  >([])
  const fetchLendData = async () => {
    const response = await queryClient?.queryContractSmart(
      process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
      {
        get_collection_info: {
          collection_address: [process.env.NEXT_PUBLIC_NFT_ADDRESS],
        },
      }
    )
    return response?.collections_info
  }

  const handleLend = async () => {
    let transactions: MsgExecuteContractEncodeObject[] = []

    transactions = [
      createExecuteMessage({
        senderAddress: accounts[0]?.address,
        contractAddress: process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
        message: {
          lend: {
            collection_address: process.env.NEXT_PUBLIC_NFT_ADDRESS,
            lend_amount: (lendAmount * 1000000).toString(),
          },
        },
        funds: [{ denom: "usei", amount: (lendAmount * 1000000).toString() }],
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
        alert("Succeed in lending. Good👍Luck!!")
      })
      .catch((e) => {
        console.log("debug error", e, typeof e)
        alert("Sorry☹️, failed lending!!")
      })
      .finally(() => {
        console.log("refetch")
        setOpenModal(false)
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

  useEffect(() => {
    fetchFloorData().then((res) => {
      if (res?.length > 0) {
        console.log(res[0]?.floor, "twilight-0117")
        setFloorData(res[0]?.floor)
      }
    })
  }, [])

  useEffect(() => {
    console.log(lendAmount)
    if (lendAmount * 2 > balance) {
      setValueError(true)
    } else {
      setValueError(false)
    }
  }, [balance, lendAmount])

  useEffect(() => {
    if (connectedWallet && queryClient) {
      fetchLendData().then((res) => {
        if (res?.length != 0) {
          const fetchedItems = res?.map((item: Item, index: number) => ({
            id: index,
            offer: item.best_offer_price,
            apy: parseFloat(item.collection_info.apy) * 100,
            duration: item.collection_info.limit_time,
          }))
          console.log(fetchedItems, "fetchedItems----")
          setLendData(fetchedItems)
        }
      })
      queryClient.getBalance(accounts[0]?.address, "usei").then((res) => {
        console.log(res, "balance---------")
        setBalance(parseInt(res?.amount) / 1000000)
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
  return (
    <section className="px-16 pb-3 pt-6">
      <h1 className="mx-auto mb-5 text-left font-inria text-4xl text-custom sm:text-5xl md:text-6xl lg:text-7xl">
        MAKE LOAN OFFERS ON NFT COLLECTIONS.
      </h1>
      <div className="flex items-center gap-3">
        <Search color="white" />
        <Input
          placeholder="Search Collections"
          className=" border-0 bg-transparent text-white focus:border-0"
        />
      </div>
      <Separator className="mb-2 border" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Collection</TableHead>
            <TableHead className="w-[15%] text-right">Best offer</TableHead>
            <TableHead className="w-[15%] text-center">APY</TableHead>
            <TableHead className="w-[15%] text-center">Duration</TableHead>
            <TableHead className="w-[15%] text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lendFetchData.map((item, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  {1}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                <div className="flex items-center justify-end gap-2 text-right">
                  <Image src={seiWhiteIcon} alt="sei" />
                  {(item as any)?.offer / 1000000}
                </div>
              </TableCell>
              <TableCell className="text-center text-lg font-bold text-[#76FF6A]">
                {(item as any)?.apy + "%"}
              </TableCell>
              <TableCell className="text-center font-medium">
                {(item as any)?.duration + "D"}
              </TableCell>
              <TableCell className="text-center font-medium">
                <Button
                  className="whitespace-nowrap px-6 py-2 text-lg font-bold md:text-xl"
                  variant={"gray"}
                  onClick={() => {
                    setCurrentData(item)
                    setOpenModal(true)
                  }}
                >
                  Lend
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog
        open={openModal}
        onOpenChange={(open) => {
          setOpenModal(open)
        }}
      >
        <DialogContent className="flex flex-col items-center bg-[#181616] sm:max-w-[425px]">
          <Image src={foxIcon} alt="collection" />
          <div className="flex w-full justify-between px-10">
            <div className="flex flex-col items-center gap-2">
              <p className=" text-lg font-extralight">APY</p>
              <p className="text-xl font-bold text-[#76FF6A]">
                {(currentLendData as any)?.apy}%
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className=" text-lg font-extralight">Duration</p>
              <p className="text-xl font-bold">
                {(currentLendData as any)?.duration}D
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className=" text-lg font-extralight">FLOOR</p>
              <div className="flex items-center justify-end gap-1 text-right">
                <Image src={seiWhiteIcon} alt="sei" />
                {floorData}
              </div>
            </div>
          </div>
          <Separator className="mb-2 w-full border-[1px]" />
          <div className="flex w-full justify-between px-5">
            <Input
              type="number"
              placeholder="Amount"
              className="text-[black]"
              value={lendAmount}
              step={0.01}
              onChange={(e) => {
                setLendAmount(parseFloat(e.target.value))
              }}
            />
          </div>
          {valueError ? (
            <div className="mt-2 flex items-center justify-center text-center text-[red]">
              Lend amount must be less than half of your balance amount.
            </div>
          ) : (
            <></>
          )}
          <div className="mt-3 flex items-center justify-end gap-1 text-right">
            Your balance is <b>{balance}</b>
            <Image src={seiWhiteIcon} alt="sei" />
          </div>
          <Button
            className="whitespace-nowrap px-3 py-1 text-lg font-bold md:text-xl"
            variant={"gray"}
            onClick={() => {
              handleLend()
            }}
          >
            Place Offer
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  )
}
