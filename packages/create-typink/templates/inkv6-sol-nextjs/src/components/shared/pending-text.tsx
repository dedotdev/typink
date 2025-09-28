import { Skeleton } from '@/components/ui/skeleton';

interface PendingTextProps extends React.ComponentProps<'span'> {
  isLoading: boolean;
}

export function PendingText(props: PendingTextProps) {
  const { isLoading, children, className, ...rest } = props;

  if (isLoading) {
    return <Skeleton className={`bg-[#8A8C93] inline-block h-4 w-32`} />;
  }

  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
}
