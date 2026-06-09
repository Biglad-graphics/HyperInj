"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SignUpPage = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);
  return null;
};

export default SignUpPage;
