#!/usr/bin/env node

/**
 * Test script to verify placeholder replacement functionality
 */

// Import the placeholder replacer function
import { replaceFaqPlaceholders } from '../lib/faq-placeholder-replacer.ts'

// Test cases for Ukrainian
console.log('=== Ukrainian (UK) Tests ===')

const ukTestValues = {
  model: 'iPhone 14 Pro',
  brand: 'Apple',
  service: 'Заміна дисплею',
  warrantyCounted: '6 місяців',
  durationFormatted: '2 години'
}

let ukText = 'Ремонт {{model}} від {{brand}} - услуга {{service}}, гарантія {{warranty}}, час: {{duration}}'
console.log('Original:', ukText)
console.log('Replaced:', replaceFaqPlaceholders(ukText, ukTestValues))
console.log()

// Test cases for English
console.log('=== English (EN) Tests ===')

const enTestValues = {
  model: 'iPhone 14 Pro',
  brand: 'Apple',
  service: 'Screen Replacement',
  warrantyCounted: '6 months',
  durationFormatted: '2 hours'
}

let enText = 'Repair {{model}} by {{brand}} - service {{service}}, warranty {{warranty}}, time: {{duration}}'
console.log('Original:', enText)
console.log('Replaced:', replaceFaqPlaceholders(enText, enTestValues))
console.log()

// Test cases for Czech
console.log('=== Czech (CS) Tests ===')

const csTestValues = {
  model: 'iPhone 14 Pro',
  brand: 'Apple',
  service: 'Výměna displeje',
  warrantyCounted: '6 měsíců',
  durationFormatted: '2 hodiny'
}

let csText = 'Oprava {{model}} od {{brand}} - služba {{service}}, záruka {{warranty}}, čas: {{duration}}'
console.log('Original:', csText)
console.log('Replaced:', replaceFaqPlaceholders(csText, csTestValues))
