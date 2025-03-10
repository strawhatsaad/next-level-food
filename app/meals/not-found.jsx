export const metadata = {
  title: "Not Found",
  description: "The meal you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>Meal Not Found</h1>
      <p>Unfortunately, we could not find the requested page or meal data.</p>
    </main>
  );
}
