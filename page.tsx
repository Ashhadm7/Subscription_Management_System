import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  Download,
  Receipt,
  Repeat,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireCustomer } from "@/lib/auth/guards";
import { getPortalOverview } from "@/lib/queries/portal";
import { customerResumeAction } from "@/lib/actions/portal";
import { formatCurrency, formatDate, humanize, intervalLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomerPortalPage() {
  const user = await requireCustomer();
  const data = await getPortalOverview(user.id);

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Customer portal" title={`Welcome back, ${user.name.split(" ")[0]}`} />
        <SectionCard title="Account not linked">
          <p className="text-sm text-muted-foreground">
            This sign-in is not connected to a customer record yet. Contact Brightloop support and we will
            link your subscriptions to this account.
          </p>
        </SectionCard>
      </div>
    );
  }

  const { customer } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={customer.customerNumber}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={`${customer.companyName ?? customer.contactName} · your subscriptions, invoices and payments.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/portal/plans"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Browse plans
            </Link>
            <Link
              href="/portal/invoices"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Receipt className="size-4" />
              Invoices
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active subscriptions"
          value={String(data.counts.active)}
          hint={`${data.counts.total} lifetime · ${data.counts.paused} paused`}
          icon={Repeat}
        />
        <StatCard
          label="Outstanding balance"
          value={formatCurrency(data.outstanding)}
          hint={data.outstanding > 0 ? "Payment due" : "All settled"}
          icon={CreditCard}
        />
        <StatCard label="Paid this year" value={formatCurrency(data.paidThisYear)} icon={Wallet} />
        <StatCard
          label="Next billing date"
          value={data.upcomingBilling[0]?.nextBillingDate ? formatDate(data.upcomingBilling[0].nextBillingDate) : "—"}
          hint={data.upcomingBilling[0]?.plan.name ?? "No scheduled billing"}
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <SectionCard
          title="Your subscriptions"
          description="Pause, resume or request cancellation from the subscription screens."
          actions={
            <Link href="/portal/subscriptions" className="text-xs font-medium text-primary hover:underline">
              Manage
            </Link>
          }
        >
          {data.subscriptions.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No subscriptions yet"
              description="When Brightloop activates a plan for you, it will appear here with its billing schedule."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {data.subscriptions.slice(0, 5).map((subscription) => (
                <li key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <Link
                      href={`/portal/subscriptions/${subscription.id}`}
                      className="text-[13px] font-medium text-foreground hover:text-primary"
                    >
                      {subscription.plan.name}
                    </Link>
                    <p className="font-mono text-[11px] text-muted-foreground">{subscription.number}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {intervalLabel(subscription.plan.interval, subscription.plan.intervalCount)} · renews{" "}
                      {formatDate(subscription.expiryDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[13px] font-semibold tabular-nums text-foreground">
                        {formatCurrency(subscription.totalAmount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">per cycle</p>
                    </div>
                    <StatusBadge status={subscription.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming billing"
          description="The next invoices scheduled for your account."
          bodyClassName="px-5 py-3"
        >
          {data.upcomingBilling.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing scheduled"
              description="Active subscriptions with a future billing date appear here."
            />
          ) : (
            <ul className="space-y-3">
              {data.upcomingBilling.map((subscription) => (
                <li key={subscription.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-foreground">{subscription.plan.name}</p>
                    <p className="font-mono text-[10.5px] text-muted-foreground">{subscription.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12.5px] font-medium text-foreground">
                      {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : "—"}
                    </p>
                    <p className="text-[11px] tabular-nums text-muted-foreground">
                      {formatCurrency(subscription.totalAmount)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Billing runs automatically on the scheduled date. Invoices are available here as soon as they are
            generated.
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Invoices"
          description="Downloadable statements for your records."
          bodyClassName="px-0 py-0"
          actions={
            <Link href="/portal/invoices" className="mr-1 text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {data.invoices.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description="Invoices generated by the billing cycle will be listed here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invoices.slice(0, 5).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/portal/invoices/${invoice.id}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.displayStatus} />
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-medium tabular-nums">
                      {formatCurrency(invoice.total)}
                      {invoice.amountDue > 0 &&
                      (invoice.displayStatus === "CONFIRMED" || invoice.displayStatus === "PARTIALLY_PAID") ? (
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          {formatCurrency(invoice.amountDue, { precise: true })} due
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`/api/invoices/${invoice.id}/pdf`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Download className="size-3.5" /> PDF
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard
          title="Payment history"
          description="Receipts recorded against your invoices."
          actions={
            <Link href="/portal/payments" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {data.payments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payments recorded"
              description="Once a payment is received, the receipt appears here."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {data.payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-muted-foreground">{payment.receiptNumber}</p>
                    <p className="text-[12.5px] text-foreground">
                      {humanize(payment.method)} · {formatDate(payment.paymentDate)}
                      {payment.invoice ? ` · ${payment.invoice.number}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums">
                    {formatCurrency(payment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {data.subscriptions.some((subscription) => subscription.status === "PAUSED") ? (
        <SectionCard title="Paused subscriptions" description="Resume a paused subscription at any time.">
          <ul className="divide-y divide-border/70">
            {data.subscriptions
              .filter((subscription) => subscription.status === "PAUSED")
              .map((subscription) => (
                <li key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{subscription.plan.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{subscription.number}</p>
                  </div>
                  <ActionForm action={customerResumeAction} hidden={{ subscriptionId: subscription.id }}>
                    <SubmitButton variant="outline" size="sm" pendingLabel="Resuming…">
                      Resume subscription
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title="Need something else?" description="Self-service screens for your account.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/portal/subscriptions", label: "Subscriptions", hint: "Details, pause and cancel" },
            { href: "/portal/invoices", label: "Invoices", hint: "Download PDF statements" },
            { href: "/portal/payments", label: "Payments", hint: "Receipt history" },
            { href: "/portal/profile", label: "Profile", hint: "Billing contact details" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/40"
            >
              <p className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
                {item.label}
                <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
