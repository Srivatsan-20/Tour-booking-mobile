import { redirect } from 'next/navigation';

// /track/[id] -> redirect to the full booking detail page
export default function TrackPage({ params }: { params: { id: string } }) {
    redirect(`/bookings/${params.id}`);
}
