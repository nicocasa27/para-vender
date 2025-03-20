
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const companyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  phone: z.string().min(5, {
    message: "Phone number must be at least 5 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  website: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal("")),
  tax_id: z.string().min(5, {
    message: "Tax ID must be at least 5 characters.",
  }),
  logo: z.string().optional(),
});

const taxFormSchema = z.object({
  tax_rate: z.coerce.number().min(0, {
    message: "Tax rate must be at least 0%.",
  }).max(100, {
    message: "Tax rate cannot exceed 100%.",
  }),
  tax_name: z.string().min(2, {
    message: "Tax name must be at least 2 characters.",
  }),
  tax_included: z.boolean().default(false),
});

const Configuration = () => {
  const { toast } = useToast();
  const [isCompanySubmitting, setIsCompanySubmitting] = useState(false);
  const [isTaxSubmitting, setIsTaxSubmitting] = useState(false);

  const companyForm = useForm<z.infer<typeof companyFormSchema>>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "Mi-Tiendita Inc.",
      address: "123 Main St, Anytown, USA",
      phone: "+1 (555) 123-4567",
      email: "info@mi-tiendita.com",
      website: "https://www.mi-tiendita.com",
      tax_id: "123456789",
      logo: "",
    },
  });

  const taxForm = useForm<z.infer<typeof taxFormSchema>>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      tax_rate: 7,
      tax_name: "Sales Tax",
      tax_included: false,
    },
  });

  const onCompanySubmit = (data: z.infer<typeof companyFormSchema>) => {
    setIsCompanySubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Company data:", data);
      setIsCompanySubmitting(false);
      toast({
        title: "Settings saved",
        description: "Your company information has been updated.",
      });
    }, 1500);
  };

  const onTaxSubmit = (data: z.infer<typeof taxFormSchema>) => {
    setIsTaxSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Tax data:", data);
      setIsTaxSubmitting(false);
      toast({
        title: "Settings saved",
        description: "Your tax settings have been updated.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Manage your system settings, company information, and tax configurations.
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details that will appear on invoices and receipts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="tax_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID / VAT Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter a URL for your logo image.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Enter your full business address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isCompanySubmitting}>
                      {isCompanySubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration</CardTitle>
              <CardDescription>
                Set up your tax rates and how taxes are applied to sales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...taxForm}>
                <form onSubmit={taxForm.handleSubmit(onTaxSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={taxForm.control}
                      name="tax_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Name that will appear on receipts.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={taxForm.control}
                      name="tax_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" max="100" step="0.01" />
                          </FormControl>
                          <FormDescription>
                            Percentage rate for tax calculation.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isTaxSubmitting}>
                      {isTaxSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Tax Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card className="border p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Save className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Unit Management Coming Soon</h3>
              <p className="max-w-md mt-2">
                This feature will allow you to create and manage custom units for different product categories.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Save className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">User Management Coming Soon</h3>
              <p className="max-w-md mt-2">
                This feature will allow you to manage users and their access rights within the system.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuration;
