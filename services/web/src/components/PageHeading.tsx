export function PageHeading({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="m-0 text-[22px] leading-[30px] font-[650] tracking-[-0.01em]">
        {title}
      </h1>
      <p className="m-0 mt-0.5 text-[13.5px] text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
