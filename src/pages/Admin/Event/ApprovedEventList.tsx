import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { getApprovedEvents, getCategoryById } from '@/services/Admin/event.service';
import type { ApprovedEvent, Category } from '@/types/Admin/event';
import { getUsernameByAccountId } from '@/services/auth.service';

export const ApprovedEventList = () => {
  const [events, setEvents] = useState<ApprovedEvent[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getApprovedEvents()
      .then(async (res) => {
        setEvents(res.data.items);

        // Lấy tất cả categoryId duy nhất từ các event
        const allCategoryIds = Array.from(
          new Set(res.data.items.flatMap((event) => event.categoryIds || []))
        );
        // Gọi API lấy thông tin từng category
        const categoryMap: Record<string, Category> = {};
        await Promise.all(
          allCategoryIds.map(async (id) => {
            try {
              const cat = await getCategoryById(id);
              categoryMap[id] = cat;
            } catch {
              // Failed to fetch category by id, skip this id
            }
          })
        );
        setCategories(categoryMap);

        // Lấy tất cả accountId duy nhất từ approvedBy và createdBy
        const allAccountIds = Array.from(
          new Set(
            res.data.items.flatMap((event) => [event.approvedBy, event.createdBy]).filter(Boolean)
          )
        );
        const usernameMap: Record<string, string> = {};
        await Promise.all(
          allAccountIds.map(async (id) => {
            try {
              const username = await getUsernameByAccountId(id);
              usernameMap[id] = username;
            } catch {
              usernameMap[id] = id;
            }
          })
        );
        setUsernames(usernameMap);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Approved Events</h2>
      <div className="overflow-x-auto">
        <div className="p-4 bg-white rounded-xl shadow">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-28 gap-2">
              <Progress value={70} className="w-1/2" />
              <span className="text-blue-600 text-lg font-semibold mt-2">Loading...</span>
            </div>
          ) : (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">#</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Approved At</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      No approved events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event, idx) => (
                    <TableRow key={event.eventId} className="hover:bg-gray-50">
                      <TableCell className="text-center">{idx + 1}</TableCell>
                      <TableCell>{event.eventName}</TableCell>
                      <TableCell>
                        {event.categoryIds && event.categoryIds.length > 0
                          ? event.categoryIds
                              .map((id) => categories[id]?.categoryName || id)
                              .join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {event.approvedBy ? usernames[event.approvedBy] || event.approvedBy : '-'}
                      </TableCell>
                      <TableCell>
                        {event.approvedAt ? new Date(event.approvedAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {event.createdBy ? usernames[event.createdBy] || event.createdBy : '-'}
                      </TableCell>
                      <TableCell>
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={8}>{/* Pagination UI nếu cần */}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};
