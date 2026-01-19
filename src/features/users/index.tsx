export default function UsersView({ associationId: _associationId }: { associationId: string | null }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body items-center text-center py-16">
        <h2 className="card-title text-2xl mb-2">Správa účtů</h2>
        <p className="text-base-content/60 max-w-md">
          Tato funkce je momentálně ve vývoji. Zde budete moci spravovat přístupy pro váš spolek.
        </p>
      </div>
    </div>
  );
}
