"use client"

import { useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Reveal } from "@/components/Reveal"
import { IconArrow, IconGPS, IconCheck } from "@/components/Icons"

const speciesOptions = [
  "Neem",
  "Mango",
  "Baobab",
  "Mahogany",
  "Iroko",
  "Gmelina",
  "Cashew",
  "Other",
]

const landOwnership = [
  "I own this land",
  "Community/communal land",
  "Government/public land",
  "I have permission from the owner",
]

export default function TreeRegPage() {
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1)

  return (
    <main className="bg-[#0b0a12] text-white font-[family-name:var(--font-space-grotesk)]">
      <Header />

      <section className="px-6 pb-16 pt-20 text-center md:px-16 md:pt-28">
        <Reveal>
          <p className="mb-4 font-[family-name:var(--font-space-mono)] text-xs font-bold uppercase tracking-[0.15em] text-[#f0a830]">
            Verification
          </p>
          <h1 className="mx-auto mb-6 max-w-2xl font-[family-name:var(--font-dm-sans)] text-[36px] font-medium leading-tight tracking-[-0.02em] md:text-[52px]">
            Register a tree
          </h1>
          <p className="mx-auto max-w-xl leading-[1.6] text-[#cccccc]">
            Give us the details below. Two Nature Heroes in your region will
            independently confirm your submission before it's written on-chain.
          </p>
        </Reveal>
      </section>

      <section className="px-6 pb-24 md:px-16">
        <Reveal>
          <div className="mx-auto max-w-2xl">
            {submitted ? (
              <div className="rounded-2xl border border-white/10 bg-[#08080f] py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1db954]/15">
                  <IconCheck className="h-7 w-7" />
                </div>
                <h2 className="mb-2 font-[family-name:var(--font-syne)] text-xl font-bold">
                  Submission received
                </h2>
                <p className="mx-auto max-w-sm text-sm text-white/60">
                  Your tree is now in the validation queue. Two Nature Heroes in
                  your region will review it, and you'll be notified once it's
                  verified and ready to mint.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-10 flex items-center justify-center gap-2">
                  {["Tree Details", "Location", "Photo Evidence", "Planter Info"].map(
                    (label, i) => (
                      <div key={label} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStep(i + 1)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                            step === i + 1
                              ? "bg-[#1db954] text-white"
                              : step > i + 1
                              ? "bg-[#1db954]/20 text-[#1db954]"
                              : "bg-white/5 text-white/40"
                          }`}
                        >
                          {step > i + 1 ? <IconCheck className="h-4 w-4" /> : i + 1}
                        </button>
                        {i < 3 && <span className="h-px w-6 bg-white/10 sm:w-10" />}
                      </div>
                    )
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (step < 4) {
                      setStep(step + 1)
                    } else {
                      setSubmitted(true)
                    }
                  }}
                  className="rounded-2xl border border-white/10 bg-[#08080f] p-6 md:p-10"
                >
                  {step === 1 && (
                    <div className="flex flex-col gap-5">
                      <SectionHeading title="Tree Details" subtitle="What did you plant?" />
                      <Select label="Species" options={speciesOptions} required />
                      <Field label="Planting date" type="date" required />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Approx. height (m)" type="number" placeholder="1.5" />
                        <Field label="Approx. age" placeholder="e.g. 6 months" />
                      </div>
                      <TextArea
                        label="Additional notes"
                        placeholder="Anything else Nature Heroes should know — soil type, nearby landmarks, etc."
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-5">
                      <SectionHeading title="Location" subtitle="Where is it planted?" />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Latitude" placeholder="6.5244" required />
                        <Field label="Longitude" placeholder="3.3792" required />
                      </div>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm text-white/70 transition-colors hover:border-[#1db954]/50 hover:text-white"
                      >
                        <IconGPS className="h-4 w-4" /> Use my current location
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="City/Town" placeholder="Lagos" required />
                        <Field label="Country" placeholder="Nigeria" required />
                      </div>
                      <Select label="Land ownership" options={landOwnership} required />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col gap-5">
                      <SectionHeading
                        title="Photo Evidence"
                        subtitle="Clear photos help Nature Heroes verify faster"
                      />
                      <UploadBox label="Full tree photo" required />
                      <UploadBox label="Close-up of leaves/trunk" />
                      <UploadBox label="Photo showing surrounding landmarks" />
                    </div>
                  )}

                  {step === 4 && (
                    <div className="flex flex-col gap-5">
                      <SectionHeading
                        title="Planter Info"
                        subtitle="Who gets credit for this tree?"
                      />
                      <Field label="Full name" required />
                      <Field label="Email" type="email" required />
                      <div>
                        <label className="mb-2 block text-sm text-white/70">
                          Wallet address
                        </label>
                        <input
                          placeholder="Connect your wallet to auto-fill"
                          disabled
                          className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white/40 outline-none"
                        />
                      </div>
                      <label className="flex items-start gap-3 text-sm text-white/60">
                        <input type="checkbox" required className="mt-1" />
                        I confirm this information is accurate and understand that
                        verified submissions are permanently recorded on-chain.
                      </label>
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-between">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="text-sm text-white/50 hover:text-white"
                      >
                        Back
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-full bg-[#1db954] px-6 py-3 text-sm font-medium transition-transform duration-200 hover:scale-105"
                    >
                      {step < 4 ? "Continue" : "Submit for verification"}
                      <IconArrow className="h-4 w-4 rotate-45" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">{title}</h2>
      <p className="text-sm text-white/50">{subtitle}</p>
    </div>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
      />
    </div>
  )
}

function TextArea({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">{label}</label>
      <textarea
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
      />
    </div>
  )
}

function Select({
  label,
  options,
  required = false,
}: {
  label: string
  options: string[]
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">{label}</label>
      <select
        required={required}
        defaultValue=""
        className="w-full rounded-lg border border-white/10 bg-[#050508] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#1db954]/60"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function UploadBox({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">
        {label} {required && <span className="text-[#f0a830]">*</span>}
      </label>
      <div className="flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-white/40 transition-colors hover:border-[#1db954]/50 hover:text-white/60">
        Tap to upload
      </div>
    </div>
  )
}
