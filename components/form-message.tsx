export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  const decodeMessage = (msg: string) => decodeURIComponent(msg);

  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="bg-green-50 text-green-700 border-l-4 border-green-500 px-4 py-2 rounded">
          {decodeMessage(message.success)}
        </div>
      )}
      {"error" in message && (
        <div className="bg-red-50 text-red-700 border-l-4 border-red-500 px-4 py-2 rounded">
          {decodeMessage(message.error)}
        </div>
      )}
      {"message" in message && (
        <div className="bg-gray-50 text-gray-700 border-l-4 border-gray-500 px-4 py-2 rounded">
          {decodeMessage(message.message)}
        </div>
      )}
    </div>
  );
}
