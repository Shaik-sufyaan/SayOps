"use client"

import { CustomerDirectorySection } from "@/components/customers/CustomerDirectorySection"

export function CustomersPanel() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:gap-8 lg:p-8">
      <CustomerDirectorySection />
    </div>
  )
}
