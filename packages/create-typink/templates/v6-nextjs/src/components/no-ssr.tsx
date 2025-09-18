import dynamic from "next/dynamic";
import { Props } from "@/lib/types";

const NoSsr = (props: Props) => <>{props.children}</>;

export default dynamic(() => Promise.resolve(NoSsr), {
  ssr: false,
});
