import React from 'react';

export const Table = React.forwardRef(({ className = '', ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={`w-full caption-bottom text-sm border-collapse ${className}`.trim()}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef(({ className = '', ...props }, ref) => (
  <thead ref={ref} className={`[&_tr]:border-b border-border ${className}`.trim()} {...props} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef(({ className = '', ...props }, ref) => (
  <tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`.trim()} {...props} />
));
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef(({ className = '', ...props }, ref) => (
  <tfoot
    ref={ref}
    className={`border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0 ${className}`.trim()}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef(({ className = '', ...props }, ref) => (
  <tr
    ref={ref}
    className={`border-b border-border/80 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`.trim()}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef(({ className = '', ...props }, ref) => (
  <th
    ref={ref}
    className={`h-10 px-4 text-left align-middle font-semibold text-xs text-muted-foreground uppercase tracking-wider [&:has([role=checkbox])]:pr-0 ${className}`.trim()}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef(({ className = '', ...props }, ref) => (
  <td
    ref={ref}
    className={`p-4 align-middle text-sm [&:has([role=checkbox])]:pr-0 ${className}`.trim()}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef(({ className = '', ...props }, ref) => (
  <caption
    ref={ref}
    className={`mt-4 text-xs text-muted-foreground ${className}`.trim()}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';
