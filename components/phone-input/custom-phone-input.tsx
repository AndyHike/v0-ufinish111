"use client"

import type React from "react"

import { useState, useEffect, forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { parsePhoneNumber, AsYouType, getCountries, getCountryCallingCode } from "libphonenumber-js"
import flags from "react-phone-number-input/flags"
import en from "react-phone-number-input/locale/en.json"

// Define popular countries to show at the top
const POPULAR_COUNTRIES = ["CZ", "SK", "PL", "DE", "GB", "US", "UA"]

// Get all available countries and sort them
const allCountries = getCountries()
const popularCountriesFiltered = POPULAR_COUNTRIES.filter((country) => allCountries.includes(country))

// Sort the remaining countries alphabetically by name
const otherCountries = allCountries
  .filter((country) => !POPULAR_COUNTRIES.includes(country))
  .sort((a, b) => (en[a] || a).localeCompare(en[b] || b))

// Combine the lists with popular countries first
const sortedCountries = [...popularCountriesFiltered, ...otherCountries]

interface CustomPhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
  id?: string
}

export const CustomPhoneInput = forwardRef<HTMLInputElement, CustomPhoneInputProps>(
  ({ value, onChange, placeholder, disabled, error, label, required, id }, ref) => {
    // Extract country code from the phone number
    const getInitialCountry = () => {
      if (!value) return "CZ" // Default to Czech Republic
      try {
        const parsed = parsePhoneNumber(value)
        return parsed.country || "CZ"
      } catch (e) {
        return "CZ"
      }
    }

    const [country, setCountry] = useState(getInitialCountry())
    const [nationalNumber, setNationalNumber] = useState(() => {
      if (!value) return ""
      try {
        const parsed = parsePhoneNumber(value)
        return parsed.nationalNumber || ""
      } catch (e) {
        // If parsing fails, try to extract national number by removing country code
        try {
          const countryCode = getCountryCallingCode(getInitialCountry())
          return value.replace(new RegExp(`^\\+?${countryCode}`), "")
        } catch {
          return value
        }
      }
    })

    // Update the full phone number when country or national number changes
    useEffect(() => {
      if (!country || !nationalNumber) {
        onChange(nationalNumber || "")
        return
      }

      try {
        const countryCallingCode = getCountryCallingCode(country)
        const formatter = new AsYouType(country)
        formatter.input(`+${countryCallingCode}${nationalNumber}`)
        onChange(formatter.getNumberValue() || `+${countryCallingCode}${nationalNumber}`)
      } catch (e) {
        onChange(`+${getCountryCallingCode(country)}${nationalNumber}`)
      }
    }, [country, nationalNumber, onChange])

    // Handle country change
    const handleCountryChange = (newCountry: string) => {
      setCountry(newCountry)
    }

    // Handle national number change
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow digits and remove any potential country code
      let newValue = e.target.value.replace(/\D/g, "")

      // If user tries to paste a full number with country code, strip it
      try {
        const countryCode = getCountryCallingCode(country)
        newValue = newValue.replace(new RegExp(`^${countryCode}`), "")
      } catch (e) {
        // If country code extraction fails, just use the digits
      }

      setNationalNumber(newValue)
    }

    // Handle paste event to strip country code
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text")

      // If pasted text contains a plus sign, it might be a full phone number
      if (pastedText.includes("+")) {
        e.preventDefault()

        try {
          // Try to parse the pasted text as a phone number
          const parsed = parsePhoneNumber(pastedText)
          if (parsed.country) {
            // If successful, update country and national number
            setCountry(parsed.country)
            setNationalNumber(parsed.nationalNumber || "")
          } else {
            // If parsing fails but it still has a plus, just extract digits after the plus
            const digits = pastedText.replace(/\D/g, "")
            setNationalNumber(digits)
          }
        } catch (e) {
          // If parsing fails, just extract digits
          const digits = pastedText.replace(/\D/g, "")
          setNationalNumber(digits)
        }
      }
    }

    // Format the national number for display
    const formatNationalNumber = (number: string, countryCode: string) => {
      if (!number || !countryCode) return number
      try {
        const formatter = new AsYouType(countryCode)
        formatter.input(`+${getCountryCallingCode(countryCode)}${number}`)
        return formatter.getNationalNumber()
      } catch (e) {
        return number
      }
    }

    const displayNumber = formatNationalNumber(nationalNumber, country)

    // Get flag component for a country
    const getFlag = (country: string) => {
      const Flag = flags[country]
      return Flag ? <Flag className="h-4 w-6 mr-2" /> : null
    }

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
            {label}
          </Label>
        )}
        <div className="flex space-x-2">
          <div className="w-[90px] flex-shrink-0">
            <Select value={country} onValueChange={handleCountryChange} disabled={disabled}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center">
                    {getFlag(country)}
                    <span className="ml-1">+{getCountryCallingCode(country)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortedCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    <div className="flex items-center">
                      {getFlag(country)}
                      <span className="ml-2">
                        {en[country]} (+{getCountryCallingCode(country)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow">
            <Input
              ref={ref}
              id={id}
              type="tel"
              value={displayNumber}
              onChange={handleNumberChange}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              className={error ? "border-destructive" : ""}
            />
          </div>
        </div>
        {error && value && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  },
)

CustomPhoneInput.displayName = "CustomPhoneInput"
