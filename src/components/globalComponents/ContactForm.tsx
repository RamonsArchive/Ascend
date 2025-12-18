"use client";
import React from "react";
import { useRef, useState, useActionState } from "react";
import { parseServerActionResponse } from "@/src/lib/utils";
import { ActionState, FormDataType } from "@/src/lib/global_types";
import { toast } from "sonner";
import Form from "next/form";
import { formDataToObject, updatePhoneNumber } from "@/src/lib/utils";
import { contactFormSchema } from "@/src/lib/validation";
import { z } from "zod";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, SplitText);

type ContactFormPayload = FormDataType & { service: string };

const ContactForm = ({
  services,
  submitLabel,
}: {
  services: string[];
  submitLabel: string;
}) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const firstNameLabelRef = useRef<HTMLLabelElement>(null);
  const lastNameLabelRef = useRef<HTMLLabelElement>(null);
  const emailLabelRef = useRef<HTMLLabelElement>(null);
  const phoneNumberLabelRef = useRef<HTMLLabelElement>(null);
  const serviceLabelRef = useRef<HTMLLabelElement>(null);
  const organizationLabelRef = useRef<HTMLLabelElement>(null);
  const messageLabelRef = useRef<HTMLLabelElement>(null);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneNumberRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const organizationRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [storeFormData, setStoreFormData] = useState<ContactFormPayload>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: services[0] ?? "Other",
    organization: "",
    message: "",
  });

  const [statusMessage, setStatusMessage] = useState<string>("");

  const [phoneDisplay, setPhoneDisplay] = useState("");

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    service?: string;
    organization?: string;
    message?: string;
  }>({});

  useGSAP(() => {
    // Add a small delay for Vercel deployment stability
    const initAnimations = () => {
      // Check if all refs are available before proceeding
      if (
        !firstNameLabelRef.current ||
        !lastNameLabelRef.current ||
        !firstNameRef.current ||
        !lastNameRef.current ||
        !emailRef.current ||
        !phoneNumberLabelRef.current ||
        !serviceLabelRef.current ||
        !serviceRef.current ||
        !organizationLabelRef.current ||
        !messageLabelRef.current ||
        !submitButtonRef.current
      ) {
        setTimeout(initAnimations, 100);
        return;
      }

      // get the split text elements

      // label splits
      const firstNameLabelSplit = new SplitText(firstNameLabelRef.current, {
        type: "words",
      });
      const lastNameLabelSplit = new SplitText(lastNameLabelRef.current, {
        type: "words",
      });
      const emailLabelSplit = new SplitText(emailLabelRef.current, {
        type: "words",
      });
      const phoneNumberLabelSplit = new SplitText(phoneNumberLabelRef.current, {
        type: "words",
      });
      const serviceLabelSplit = new SplitText(serviceLabelRef.current, {
        type: "words",
      });
      const organizationLabelSplit = new SplitText(
        organizationLabelRef.current,
        {
          type: "words",
        },
      );
      const messageLabelSplit = new SplitText(messageLabelRef.current, {
        type: "words",
      });

      gsap.set(
        [
          ...firstNameLabelSplit.words,
          ...lastNameLabelSplit.words,
          ...emailLabelSplit.words,
          ...phoneNumberLabelSplit.words,
          ...serviceLabelSplit.words,
          ...organizationLabelSplit.words,
          ...messageLabelSplit.words,
        ],
        {
          opacity: 0,
          yPercent: 100,
        },
      );

      gsap.set(
        [
          firstNameRef.current,
          lastNameRef.current,
          emailRef.current,
          phoneNumberRef.current,
          serviceRef.current,
          organizationRef.current,
          messageRef.current,
        ],
        {
          opacity: 0,
          yPercent: 100,
        },
      );

      gsap.set([submitButtonRef.current], {
        opacity: 0,
        yPercent: 100,
      });

      // create scroll trigger and animation for labels
      // Use single container trigger for all labels to avoid conflicts
      const allLabels = [
        ...firstNameLabelSplit.words,
        ...lastNameLabelSplit.words,
        ...emailLabelSplit.words,
        ...phoneNumberLabelSplit.words,
        ...serviceLabelSplit.words,
        ...organizationLabelSplit.words,
        ...messageLabelSplit.words,
      ];

      gsap.to(allLabels, {
        scrollTrigger: {
          trigger: "#contact-form",
          start: "top 85%",
          end: "top 35%",
          scrub: 1,
        },
        opacity: 1,
        yPercent: 0,
        stagger: 0.02, // Small stagger for smooth sequence
      });

      // create scroll trigger and animation for inputs
      // Use single container trigger for all inputs to avoid conflicts
      const allInputs = [
        firstNameRef.current,
        lastNameRef.current,
        emailRef.current,
        phoneNumberRef.current,
        serviceRef.current,
        organizationRef.current,
        messageRef.current,
      ].filter(Boolean);

      gsap.to(allInputs, {
        scrollTrigger: {
          trigger: "#contact-form",
          start: "top 85%",
          end: "top 35%",
          scrub: 1,
        },
        opacity: 1,
        yPercent: 0,
        stagger: 0.02, // Match label timing
      });

      // create scroll trigger and animation for accent divider and submit button
      const remainingElements = [submitButtonRef.current];

      gsap.to(remainingElements, {
        scrollTrigger: {
          trigger: "#contact-form",
          start: "top 75%",
          end: "top 25%",
          scrub: 1,
        },
        opacity: 1,
        yPercent: 0,
        stagger: 0.1, // Slightly more stagger for visual separation
      });

      return () => {
        firstNameLabelSplit.revert();
        lastNameLabelSplit.revert();
        emailLabelSplit.revert();
        phoneNumberLabelSplit.revert();
        serviceLabelSplit.revert();
        organizationLabelSplit.revert();
        messageLabelSplit.revert();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    };
    initAnimations();
  }, []);

  const resetForm = () => {
    setStoreFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      service: services[0] ?? "Other",
      organization: "",
      message: "",
    });
    setPhoneDisplay("");
    setErrors({});
  };

  const submitForm = async (
    state: ActionState,
    formData: FormData,
  ): Promise<ActionState> => {
    try {
      setErrors({});
      const formObject = formDataToObject(formData);
      const cleanNumber = phoneDisplay.replace(/[^0-9]/g, "");
      formObject.phone = cleanNumber;

      await contactFormSchema.parseAsync(formObject);

      const result = parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: {
          ...formObject,
          createdAt: new Date().toISOString(),
        },
      });

      if (result.status === "ERROR") {
        setStatusMessage("Something went wrong. Please try again.");
        toast.error("ERROR", {
          description: result.error,
        });
        return parseServerActionResponse({
          status: "ERROR",
          error: result.error,
          data: null,
        });
      }

      resetForm();
      setStatusMessage(
        "Form submitted successfully. We will get back to you soon!",
      );
      toast.success("SUCCESS", {
        description: "Form submitted successfully",
      });

      return parseServerActionResponse({
        status: "SUCCESS",
        error: "",
        data: result.data,
      });
    } catch (error) {
      console.error(error);
      setStatusMessage(
        "An error occurred while submitting the form. Please try again.",
      );
      if (error instanceof z.ZodError) {
        const fieldErrors = z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >;
        const formattedErrors: Record<string, string> = {};
        Object.keys(fieldErrors).forEach((key) => {
          formattedErrors[key] = fieldErrors[key]?.[0] || "";
        });
        setErrors(formattedErrors);
        toast.error("ERROR", {
          description: Object.values(formattedErrors).join(", "),
        });
        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formattedErrors).join(", "),
          data: null,
        });
      }
      toast.error("ERROR", {
        description:
          "An error occurred while submitting the form. Please try again.",
      });

      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while submitting the form",
        data: null,
      });
    }
  };

  const [, formAction, isPending] = useActionState(submitForm, {
    status: "INITIAL",
    error: "",
    data: null,
  });

  const handleFormChange = (key: string, value: string) => {
    if (key === "phone") {
      updatePhoneNumber(value, phoneDisplay, setPhoneDisplay);
      const cleanPhone = value.replace(/[^0-9]/g, "");
      setStoreFormData({ ...storeFormData, phone: cleanPhone });
      return;
    }

    setStoreFormData({ ...storeFormData, [key]: value });
  };

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <div className="flex flex-col gap-6 md:gap-8">
        <Form
          action={formAction}
          className="flex flex-col gap-8 md:gap-10"
          id="contact-form"
        >
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="firstName"
                  ref={firstNameLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  placeholder="First Name"
                  ref={firstNameRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  value={storeFormData.firstName}
                  onChange={(e) =>
                    handleFormChange("firstName", e.target.value)
                  }
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="lastName"
                  ref={lastNameLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  placeholder="Last Name"
                  ref={lastNameRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  value={storeFormData.lastName}
                  onChange={(e) => handleFormChange("lastName", e.target.value)}
                />
                {errors.lastName && (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.lastName}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="email"
                  ref={emailLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  ref={emailRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  placeholder="Email"
                  value={storeFormData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.email}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="phone"
                  ref={phoneNumberLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  ref={phoneNumberRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  placeholder="Phone Number"
                  value={phoneDisplay}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                />
                {errors.phone && (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.phone}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="service"
                  ref={serviceLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  Reason
                </label>
                <select
                  name="service"
                  id="service"
                  ref={serviceRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  value={storeFormData.service}
                  onChange={(e) => handleFormChange("service", e.target.value)}
                >
                  {services.map((s) => (
                    <option key={s} value={s} className="bg-primary-950">
                      {s}
                    </option>
                  ))}
                </select>
                {errors.service && (
                  <p className="text-red-400 text-xs md:text-sm">
                    {errors.service}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 overflow-hidden">
                <label
                  htmlFor="organization"
                  ref={organizationLabelRef}
                  className="text-xs md:text-sm text-white/75"
                >
                  Organization
                </label>
                <input
                  type="text"
                  name="organization"
                  id="organization"
                  ref={organizationRef}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  placeholder="Organization"
                  value={storeFormData.organization}
                  onChange={(e) =>
                    handleFormChange("organization", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-hidden">
              <label
                htmlFor="message"
                ref={messageLabelRef}
                className="text-xs md:text-sm text-white/75"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                id="message"
                ref={messageRef}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[160px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                placeholder="Message"
                value={storeFormData.message}
                onChange={(e) => handleFormChange("message", e.target.value)}
              />
              {errors.message && (
                <p className="text-red-400 text-xs md:text-sm">
                  {errors.message}
                </p>
              )}
            </div>
            <div className="flex w-full justify-center overflow-hidden">
              <button
                type="submit"
                ref={submitButtonRef}
                className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "Sending..." : submitLabel}
              </button>
            </div>
          </div>
        </Form>
        {statusMessage && (
          <div className="flex items-center justify-center w-full">
            <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              {statusMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactForm;
