"use client"

import { useState, useRef, useEffect } from "react"
import type { CountryCode } from "libphonenumber-js"
import { getCountries, getCountryCallingCode } from "react-phone-number-input/input"
import en from "react-phone-number-input/locale/en.json"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import flags from "react-phone-number-input/flags"

// Define popular countries to show at the top
const POPULAR_COUNTRIES: CountryCode[] = ["CZ", "SK", "PL", "DE", "GB", "US", "UA"]

interface CountrySelectProps {
  value: CountryCode | undefined
  onChange: (value: CountryCode) => void
  labels: Record<CountryCode, string>
  disabled?: boolean
}

export function CustomCountrySelect({ value, onChange, labels, disabled }: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [triggerWidth, setTriggerWidth] = useState<number>(0)

  useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth)
    }
  }, [open])

  // Get all available countries
  const allCountries = getCountries() as CountryCode[]

  // Filter countries based on search query
  const filteredCountries = allCountries.filter((country) => {
    const label = labels[country] || en[country]
    return label.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Separate popular countries from the rest
  const popularCountries = POPULAR_COUNTRIES.filter((country) => filteredCountries.includes(country))
  const otherCountries = filteredCountries.filter((country) => !POPULAR_COUNTRIES.includes(country))

  // Sort countries alphabetically
  otherCountries.sort((a, b) => {
    const labelA = labels[a] || en[a]
    const labelB = labels[b] || en[b]
    return labelA.localeCompare(labelB)
  })

  // Get flag component for a country
  const getFlag = (country: CountryCode) => {
    const Flag = flags[country]
    return Flag ? <Flag className="h-4 w-6 mr-2" /> : null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex justify-between w-full px-3 font-normal cursor-pointer"
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center overflow-hidden">
            {value ? (
              <span className="flex items-center truncate">
                {getFlag(value)}
                <span className="ml-1">+{getCountryCallingCode(value)}</span>
              </span>
            ) : (
              "Select"
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 absolute overflow-hidden" style={{ width: Math.max(triggerWidth, 250) }}>
        <Command>
          <CommandInput
            placeholder="Search country..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
            icon={Search}
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <ScrollArea className="h-[300px]">
              {popularCountries.length > 0 && (
                <CommandGroup heading="Popular Countries">
                  {popularCountries.map((country) => (
                    <CommandItem
                      key={country}
                      value={country}
                      onSelect={() => {
                        onChange(country)
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        {getFlag(country)}
                        <span>
                          {labels[country] || en[country]} (+{getCountryCallingCode(country)})
                        </span>
                      </div>
                      {value === country && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading="All Countries">
                {otherCountries.map((country) => (
                  <CommandItem
                    key={country}
                    value={country}
                    onSelect={() => {
                      onChange(country)
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      {getFlag(country)}
                      <span>
                        {labels[country] || en[country]} (+{getCountryCallingCode(country)})
                      </span>
                    </div>
                    {value === country && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
