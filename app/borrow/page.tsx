"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import foxIcon from "@/public/foxylend-logo.svg"
import foxCollectionIcon from "@/public/nft/fox_collection.png"
import seiWhiteIcon from "@/public/sei-white.svg"
import { fetchFloorData } from "@/services/common/fetchFloorData"
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate"
import { coins } from "@cosmjs/launchpad"
import { Separator } from "@radix-ui/react-separator"
import {
  useCosmWasmClient,
  useSigningCosmWasmClient,
  useWallet,
} from "@sei-js/react"
import axios from "axios"
import { Search } from "lucide-react"
import toast from "react-hot-toast"

import useContract from "@/hooks/useContract"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import NFTContainer from "@/components/common/nft-container"

const lendData = [
  {
    collection: "Fud Foxes",
    pool: "954.54",
    offer: "98.5",
    interest: "26.343",
    duration: "14D",
  },
  {
    collection: "Fud Foxes",
    pool: "8.54",
    offer: "98.5",
    interest: "26.343",
    duration: "14D",
  },
  {
    collection: "Fud Foxes",
    pool: "94.54",
    offer: "98.5",
    interest: "26.343",
    duration: "14D",
  },
  {
    collection: "Fud Foxes",
    pool: "8854.54",
    offer: "98.5",
    interest: "26.343",
    duration: "14D",
  },
]

export default function Borrow() {
  const [openModal, setOpenModal] = useState(false)
  const [floorData, setFloorData] = useState(0)
  const [lendFetchData, setLendData] = useState([])
  const [borrowFetchData, setBorrowFetchData] = useState([])
  const [interestData, setInterestData] = useState([])
  const [currentLendData, setCurrentData] = useState()
  const { createExecuteMessage } = useContract()
  const { connectedWallet, accounts } = useWallet()
  const { cosmWasmClient: queryClient } = useCosmWasmClient()
  const { signingCosmWasmClient: signingClient } = useSigningCosmWasmClient()
  const [selectedItems, setSelectedItems] = useState<
    Array<{ id: number; kind: string; title: string; selected: boolean }>
  >([])
  const toggleSelectedItem = (id: number) => {
    const updatedItems = selectedItems.map((item) => {
      if (item.id === id) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    setSelectedItems(updatedItems)
  }
  const fetchBorrowData = async () => {
    const response = await queryClient?.queryContractSmart(
      process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
      {
        get_offer_list_by_collection: {
          collection_address: process.env.NEXT_PUBLIC_NFT_ADDRESS,
        },
      }
    )

    let borrow_data: any = []
    response.offer_info.map((item: any) => {
      if (item.status != "accepted") borrow_data.push(item)
    })
    return borrow_data
  }

  const fetchFoxData = async () => {
    const response = await queryClient?.queryContractSmart(
      process.env.NEXT_PUBLIC_NFT_ADDRESS || "",
      {
        tokens: {
          owner: accounts[0]?.address,
        },
      }
    )
    console.log(response)
    return response.tokens
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

  const fetchLendData = async () => {
    const response = await axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND}/lend/collection_info`)
      .then((res) => res.data)
      .catch((error) => console.log("error", error))

    return response?.collections_info
  }

  const handleSteik = async () => {
    const checkedItems = selectedItems.filter((item) => item.selected === true)
    console.log(checkedItems, "here")
    // if(checkedItems)
    let transactions: MsgExecuteContractEncodeObject[] = []

    if (checkedItems.length === 1) {
      console.log(
        {
          token_id: checkedItems[0].title?.toString(),
          spender: process.env.NEXT_PUBLIC_LENDER_ADDRESS,
        },
        "check here"
      )
      transactions = [
        createExecuteMessage({
          senderAddress: accounts[0]?.address,
          contractAddress: process.env.NEXT_PUBLIC_NFT_ADDRESS || "",
          message: {
            approve: {
              token_id: checkedItems[0].title?.toString(),
              spender: process.env.NEXT_PUBLIC_LENDER_ADDRESS,
            },
          },
        }),
        createExecuteMessage({
          senderAddress: accounts[0]?.address,
          contractAddress: process.env.NEXT_PUBLIC_LENDER_ADDRESS || "",
          message: {
            borrow: {
              offer_id: (currentLendData as any)?.offer_id,
              token_id: checkedItems[0].title?.toString(),
            },
          },
        }),
      ]
    }
    if (!transactions.length) {
      toast.error("Sorry☹️, failed borrowing!", {
        position: "top-right",
      })
      return
    }
    const fee = {
      amount: [{ amount: "0.1", denom: "usei" }],
      gas: (checkedItems.length * 700000).toString(),
    }
    signingClient
      ?.signAndBroadcast(accounts[0]?.address, transactions, fee)
      .then((res) => {
        if (res.code !== 0) {
          throw new Error(res.rawLog)
        }
        toast.success("Succeed in borrowing. Good👍Luck!!", {
          position: "top-right",
        })
      })
      .catch((e) => {
        console.log("debug error", e, typeof e)
        toast.error("Sorry☹️, failed borrowing!", {
          position: "top-right",
        })
      })
      .finally(() => {
        console.log("refetch")
        setOpenModal(false)
        // setIsLoading(true)
        // fetchSteikCount().then((res: Array<string>) => {
        //   if (res?.length != 0) {
        //     const fetchedItems = res?.map((item: string, index: number) => ({
        //       id: index,
        //       kind: item,
        //       title: item,
        //       selected: false,
        //     }))
        //     console.log(fetchedItems, "fetchedItems----")
        //     setSelectedItems(fetchedItems)
        //   }
        //   if (res?.length === 0) {
        //     setSelectedItems([])
        //   }
        //   setIsLoading(false)
        // })
      })
  }

  useEffect(() => {
    if (connectedWallet && queryClient) {
      fetchBorrowData().then((res) => {
        if (res?.length > 0) {
          // console.log(res[0]?.floor, "twilight-0117")
          setBorrowFetchData(res)
        }
      })
    }
  }, [queryClient])

  useEffect(() => {
    if (borrowFetchData?.length > 0) {
      let _interestData: any[] = []
      let promises = borrowFetchData.map((item: any) => {
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
  }, [borrowFetchData])

  useEffect(() => {
    if (connectedWallet && queryClient) {
      fetchLendData().then((res) => {
        if (res?.length != 0) {
          const fetchedItems = res?.map((item: any, index: number) => ({
            id: index,
            offer: item.best_offer_price,
            apy: parseFloat(item.collection_info.apy) * 100,
            duration: item.collection_info.limit_time,
          }))
          setLendData(fetchedItems)
        }
      })

      fetchFoxData().then((res) => {
        if (res?.length > 0) {
          setSelectedItems(
            res?.map((item: any, index: number) => {
              return {
                id: parseInt(item),
                title: parseInt(item),
                kind: parseInt(item),
                selected: false,
              }
            })
          )
          // console.log(res[0]?.floor, "123123")
          // setFloorData(res[0]?.floor)
        }
      })
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
    fetchFloorData().then((res) => {
      if (res?.length > 0) {
        console.log(res[0]?.floor, "123123")
        setFloorData(res[0]?.floor)
      }
    })
  }, [])

  return (
    <section className="px-16 pb-3 pt-6">
      <h1 className="mx-auto mb-5 text-left font-inria text-4xl text-custom sm:text-5xl md:text-6xl lg:text-7xl">
        BORROW AGAINST YOUR NFTS
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
            {/* <TableHead className="w-[12%] text-right">Available pool</TableHead> */}
            <TableHead className="w-[12%] text-right">Offer Amount</TableHead>
            <TableHead className="w-[12%] text-center">Interest</TableHead>
            <TableHead className="w-[12%] text-center">Duration</TableHead>
            <TableHead className="w-[12%] text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {borrowFetchData.map((item: any, index) => (
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
              <TableCell className="text-right font-medium">
                <div className="flex items-center justify-end gap-2 text-right">
                  <Image src={seiWhiteIcon} alt="sei" />
                  {item.price / 1000000}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2 text-center text-lg font-bold text-[#76FF6A]">
                  <Image src={seiWhiteIcon} alt="sei" />
                  {(interestData[index] - item.price) / 1000000}
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">
                {lendFetchData[index] &&
                  (lendFetchData[index] as { duration: number }).duration}
                D
              </TableCell>
              <TableCell className="text-center font-medium">
                <Button
                  className="whitespace-nowrap px-6 py-2 text-lg font-bold md:text-xl"
                  onClick={() => {
                    setOpenModal(true)
                    console.log(
                      {
                        ...item,
                        duration:
                          lendFetchData[index] &&
                          (lendFetchData[index] as { duration: number })
                            .duration,
                        apy: (lendFetchData[index] as any)?.apy,
                        floor: floorData,
                        repayAmount: interestData[index],
                      },
                      "123123"
                    )
                    setCurrentData({
                      ...item,
                      duration: (lendFetchData[index] as any)?.duration,
                      apy: (lendFetchData[index] as any)?.apy,
                      floor: floorData,
                      repayAmount: interestData[index],
                    })
                  }}
                >
                  BORROW
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
                {(currentLendData as any)?.floor}
              </div>
            </div>
          </div>
          <Separator className="mb-2 w-full border-[1px]" />
          <div className="flex w-full justify-between">
            {selectedItems?.map((item, index) => (
              <NFTContainer
                id={item.id} // It's better to have a more unique key if possible
                kind={item.kind}
                title={item.title}
                selected={item.selected}
                onClick={() => toggleSelectedItem(item.id)}
              />
            ))}
          </div>
          {/* <p> NFT Selected</p>
          <div className=" flex items-center justify-end gap-1 text-right">
            <Image src={seiWhiteIcon} alt="sei" />
            <b className="text-lg">20.5</b>
          </div> */}
          <Button
            className="whitespace-nowrap px-3 py-1 text-lg font-bold md:text-xl"
            onClick={() => {
              handleSteik()
            }}
          >
            Borrow
          </Button>
          <div className=" flex items-center justify-end gap-1 text-right">
            Repay
            <b className="text-lg">
              {parseInt((currentLendData as any)?.repayAmount) / 1000000}
            </b>
            <Image src={seiWhiteIcon} alt="sei" />
            in {(currentLendData as any)?.duration} days.
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
