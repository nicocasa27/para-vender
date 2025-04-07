import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, Plus, Filter, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { useStores } from "@/hooks/useStores";

export const Inventory = () => {
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader, Plus, Filter, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { useStores } from "@/hooks/useStores";
import { Product } from "@/types/inventory";

export const Inventory = () => {
