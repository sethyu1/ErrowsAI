export default function Character() {
  return (
    <div className="flex-1 flex flex-col h-screen w-full overflow-auto p-8">
      <div className="flex flex-col items-center justify-center mt-20">
        <h1 className="text-white text-center mb-6" style={{
          fontFamily: 'Public Sans',
          fontWeight: 700,
          fontSize: '48px',
          lineHeight: '56px',
        }}>
          CHARACTER
        </h1>
        <p className="text-center" style={{
          fontFamily: 'Urbanist',
          fontWeight: 500,
          fontSize: '18px',
          lineHeight: '28px',
          color: '#DBDBE6',
        }}>
          Explore and create AI characters
        </p>
      </div>
    </div>
  )
}
