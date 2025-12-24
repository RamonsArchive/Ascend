import React from "react";
import EventEmailInviteForm from "@/src/components/eventComponents/EventEmailInviteForm";
import EventInviteLinkForm from "@/src/components/eventComponents/EventInviteLinkForm";

const EventMembersAdminSection = ({ eventId }: { eventId: string }) => {
  return (
    <section className="w-full flex flex-col items-center">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-10 md:gap-12">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-white">
            Members
          </h2>
          <div className="text-sm md:text-base text-white/70 leading-relaxed max-w-4xl">
            Manage the members of your event.
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-white text-base md:text-lg font-semibold">
                Invite by email
              </div>
              <div className="text-white/65 text-xs md:text-sm leading-relaxed">
                Send a direct invite to a specific email address.
              </div>
            </div>
            <EventEmailInviteForm eventId={eventId} />
          </div>

          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-white text-base md:text-lg font-semibold">
                Invite link
              </div>
              <div className="text-white/65 text-xs md:text-sm leading-relaxed">
                Generate a shareable link with optional expiration and usage
                limits.
              </div>
            </div>
            <EventInviteLinkForm eventId={eventId} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventMembersAdminSection;
