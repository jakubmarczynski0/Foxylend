"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

import NFT from "../utils/nfts"

interface NFTContainerProps {
  id: number
  kind: string
  title: string
  selected: boolean
  onClick: () => void
}

export default function NFTContainer({
  id,
  kind,
  title,
  selected = false,
  onClick,
}: NFTContainerProps) {
  interface ResponsiveImageProps {
    image: string
    alt: string
  }

  const ResponsiveImage: React.FC<ResponsiveImageProps> = ({ image, alt }) => {
    const [screenSize, setScreenSize] = useState<number>(window.innerWidth)

    const handleResize = () => {
      setScreenSize(window.innerWidth)
    }

    useEffect(() => {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }, [])

    const getWidth = (): number => {
      if (screenSize >= 1024) return 56 // lg size
      if (screenSize >= 640) return 48 // sm size
      return 36 // base size
    }

    // Use the `image` directly in the src
    return (
      <img src={image} alt={alt} className="size-36 sm:size-48 lg:size-56" />
    )
  }
  const PIC_URL =
    "https://arweave.net/LPcSbe29BP10zETqtcCrS_JHuZ0AsiE2g0c4H-8G-eU/"
  return (
    <div
      className={`mx-auto flex w-fit cursor-pointer flex-col items-center justify-start rounded-md transition-transform duration-200 hover:scale-105 ${selected ? "bg-blue-200" : "bg-white"}`}
      onClick={onClick}
    >
      <ResponsiveImage
        image={PIC_URL + kind + ".png"}
        alt="Fox Logo"
        // className="size-36 sm:size-48 lg:size-56"
      />
      <div className="my-2 flex items-end md:mb-3 md:mt-2 lg:mb-4 lg:mt-3">
        <span className="text-lg !leading-none text-custom md:text-xl xl:text-2xl ">
          Fox
        </span>
        <span className="xl:text-md text-end text-xs !leading-none text-custom md:text-sm">
          {title}
        </span>
      </div>
    </div>
  )
}
