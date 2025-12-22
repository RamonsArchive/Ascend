"use client";

import React, { useRef, useState, useActionState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ActionState } from "@/src/lib/global_types";
import { parseServerActionResponse } from "@/src/lib/utils";
import { createOrgInviteEmailClientSchema } from "@/src/lib/validation";

// TODO: change this import to your real action
import { createOrgEmailInvite } from "@/src/actions/org_invites_actions";

gsap.registerPlugin(ScrollTrigger, SplitText);

const initialState: ActionState = { status: "INITIAL", error: "", data: null };

const AddOrgMemberEmailForm = ({ orgId }: { orgId: string }) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const emailLabelRef = useRef<HTMLLabelElement>(null);
  const roleLabelRef = useRef<HTMLLabelElement>(null);
  const messageLabelRef = useRef<HTMLLabelElement>(null);

  const [statusMessage, setStatusMessage] = useState("");
  const [formData, setFormData] = useState(() => ({
    email: "",
    role: "MEMBER",
    message: "",
  }));

  const [errors, setErrors] = useState<{
    email?: string;
    role?: string;
    message?: string;
  }>({});

  useGSAP(() => {
    let cleanup: undefined | (() => void);

    const init = () => {
      if (
        !emailLabelRef.current ||
        !roleLabelRef.current ||
        !messageLabelRef.current ||
        !submitButtonRef.current
      ) {
        requestAnimationFrame(init);
        return;
      }

      const triggerEl = document.getElementById("add-org-member-email-form");
      if (!triggerEl) {
        requestAnimationFrame(init);
        return;
      }

      const splits = [
        new SplitText(emailLabelRef.current, { type: "words" }),
        new SplitText(roleLabelRef.current, { type: "words" }),
        new SplitText(messageLabelRef.current, { type: "words" }),
      ];

      const allLabels = splits.flatMap((s) => s.words);
      const allInputs = [
        submitButtonRef.current,
        ...Array.from(triggerEl.querySelectorAll("input, textarea, select")),
      ] as HTMLElement[];

      gsap.set(allLabels, { opacity: 0, y: 48 });
      gsap.set(allInputs, { opacity: 0, y: 48 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
        defaults: { ease: "power3.out", duration: 0.6 },
      });

      tl.to(allLabels, { opacity: 1, y: 0, stagger: 0.02 }, 0).to(
        allInputs,
        { opacity: 1, y: 0, stagger: 0.04 },
        0.05
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());

      cleanup = () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        splits.forEach((s) => s.revert());
      };
    };

    init();
    return () => cleanup?.();
  }, []);

  const clearForm = () => {
    setFormData({ email: "", role: "MEMBER", message: "" });
    setErrors({});
    setStatusMessage("");
  };

  const submit = async (
    _state: ActionState,
    _fd: FormData
  ): Promise<ActionState> => {
    try {
      void _state;
      void _fd;

      setErrors({});
      setStatusMessage("");

      const parsed = await createOrgInviteEmailClientSchema.parseAsync({
        orgId,
        email: formData.email,
        role: formData.role,
        message: formData.message || undefined,
      });

      setStatusMessage("Sending invite…");

      const fd = new FormData();
      fd.set("orgId", parsed.orgId);
      fd.set("email", parsed.email);
      fd.set("role", parsed.role);
      if (parsed.message) fd.set("message", parsed.message);

      const result = await createOrgEmailInvite(initialState, fd);

      if (result.status === "ERROR") {
        setStatusMessage(result.error || "Failed to send invite.");
        toast.error("ERROR", {
          description: result.error || "Failed to send invite.",
        });
        return result;
      }

      setStatusMessage("Invite sent.");
      toast.success("SUCCESS", { description: "Invite sent." });

      clearForm();
      return result;
    } catch (error) {
      console.error(error);
      setStatusMessage("Please fix the highlighted fields.");

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
          description: Object.values(formattedErrors)
            .filter(Boolean)
            .join(", "),
        });

        return parseServerActionResponse({
          status: "ERROR",
          error: Object.values(formattedErrors).filter(Boolean).join(", "),
          data: null,
        }) as ActionState;
      }

      toast.error("ERROR", {
        description: "An error occurred. Please try again.",
      });
      return parseServerActionResponse({
        status: "ERROR",
        error: "An error occurred while sending invite",
        data: null,
      }) as ActionState;
    }
  };

  const [, formAction, isPending] = useActionState(submit, initialState);

  return (
    <div className="marketing-card w-full rounded-3xl px-6 py-6 md:px-8 md:py-8 bg-white/4">
      <form
        id="add-org-member-email-form"
        action={formAction}
        className="flex flex-col gap-6 md:gap-8"
      >
        <div className="flex flex-col gap-2">
          <label
            ref={emailLabelRef}
            className="text-xs md:text-sm text-white/75 flex items-center gap-1"
          >
            Invite by email
            <span className="text-xs text-red-500">*</span>
          </label>
          <input
            value={formData.email}
            onChange={(e) =>
              setFormData((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="person@domain.com"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          />
          {errors.email ? (
            <p className="text-red-500 text-xs md:text-sm">{errors.email}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label
              ref={roleLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData((p) => ({ ...p, role: e.target.value }))
              }
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role ? (
              <p className="text-red-500 text-xs md:text-sm">{errors.role}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label
              ref={messageLabelRef}
              className="text-xs md:text-sm text-white/75"
            >
              Message (optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData((p) => ({ ...p, message: e.target.value }))
              }
              placeholder="Add a short note…"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm md:text-base text-white placeholder:text-white/40 outline-none focus:border-accent-100 focus:ring-2 focus:ring-accent-500/20 transition-colors min-h-[110px] resize-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            />
            {errors.message ? (
              <p className="text-red-500 text-xs md:text-sm">
                {errors.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full justify-center">
          <button
            type="submit"
            disabled={isPending}
            ref={submitButtonRef}
            className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Sending..." : "Send invite"}
          </button>
        </div>
      </form>

      {statusMessage ? (
        <div className="flex items-center justify-center w-full pt-6">
          <p className="text-white/90 text-xs md:text-sm text-center px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            {statusMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AddOrgMemberEmailForm;
