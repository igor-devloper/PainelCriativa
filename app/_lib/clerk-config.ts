import { UserProfile } from "@clerk/nextjs";

export const appearanceConfig: Parameters<typeof UserProfile>[0]["appearance"] =
  {
    elements: {
      userProfilePopoverCard: {
        width: "100%",
      },
      userButtonBox: "w-full",
      userButtonTrigger: "w-full",
      userButtonAvatarBox: "h-10 w-10",
      userButtonOuterIdentifier: "text-black font-semibold",
    },
  };
