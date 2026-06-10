/* Ícones Lucide inline (stroke 2, round) — sem lib externa, sem emoji. */

interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number, className: string | undefined, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconDashboard = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ));

export const IconMessage = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />);

export const IconCalendar = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ));

export const IconUsers = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ));

export const IconBrain = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    </>
  ));

export const IconSettings = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ));

export const IconTarget = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ));

export const IconBuilding = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" />
    </>
  ));

export const IconPlus = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="M5 12h14M12 5v14" />);

export const IconChevrons = ({ size = 16, className }: IconProps) =>
  base(size, className, <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />);

export const IconLogout = ({ size = 16, className }: IconProps) =>
  base(size, className, (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ));

/** Selo oficial da Lena (versão vetorial exata). */
export const LenaSelo = ({ size = 28, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 1254 1254" className={className} aria-hidden="true">
    <rect x="167" y="166" width="920" height="920" rx="256" fill="#E35B2E" />
    <path
      d="M434 329 C450.7 328.3 507.7 328.5 524 329 C540.3 329.5 538 333 538 340 L539 730 C540.2 799.3 541.5 747.5 545 756 C548.5 764.5 553.8 773.8 560 781 C566.2 788.2 573.3 794.0 582 799 C590.7 804.0 601.0 808.2 612 811 C623.0 813.8 634.2 815.7 648 816 C661.8 816.3 682.2 814.8 695 813 C707.8 811.2 714.8 808.8 725 805 C735.2 801.2 745.3 797.2 756 790 C766.7 782.8 780.0 771.8 789 762 C798.0 752.2 810 731 810 731 C810 731 815.7 728.2 821 730 C826.3 731.8 834.7 739.0 842 742 C849.3 745.0 857.0 746.8 865 748 C873.0 749.2 885.0 747.8 890 749 C895.0 750.2 895 755 895 755 C893.7 766.5 891 774 879 800 C872.0 811.3 860.7 829.0 849 842 C837.3 855.0 822.8 867.8 809 878 C795.2 888.2 780.8 896.2 766 903 C751.2 909.8 737.7 915.0 720 919 C702.3 923.0 681.3 926.3 660 927 C638.7 927.7 612.3 926.0 592 923 C571.7 920.0 553.7 914.8 538 909 C522.3 903.2 510.8 897.2 498 888 C485.2 878.8 471.7 867.5 461 854 C450.3 840.5 439.8 819.3 434 807 C428.2 794.7 428.5 792.5 426 780 C423.5 767.5 420 758 419 732 L419 341 C419.8 333 426.5 329.7 434 329 Z"
      fill="#FDF3E6"
    />
    <circle cx="862" cy="683" r="49.5" fill="#599372" />
  </svg>
);
