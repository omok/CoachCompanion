import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Player, Attendance, PracticeNote, Payment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  Calendar,
  BookOpen,
  DollarSign,
  Loader2,
} from "lucide-react";
import { AttendanceStats } from "@/components/attendance-stats";

export default function PlayerDetails() {
  const { user } = useAuth();
  const [, params] = useRoute("/player/:teamId/:playerId");
  const teamId = parseInt(params?.teamId || "0");
  const playerId = parseInt(params?.playerId || "0");
  const [activeTab, setActiveTab] = useState("details");

  // Fetch player details
  const { data: player, isLoading: isLoadingPlayer } = useQuery<Player>({
    queryKey: [`/api/teams/${teamId}/players/${playerId}`],
    enabled: !!teamId && !!playerId,
  });

  // Fetch attendance records
  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/teams/${teamId}/attendance/player/${playerId}`],
    enabled: !!teamId && !!playerId,
  });

  // Fetch practice notes
  const { data: practiceNotes, isLoading: isLoadingNotes } = useQuery<PracticeNote[]>({
    queryKey: [`/api/teams/${teamId}/practice-notes/player/${playerId}`],
    enabled: !!teamId && !!playerId,
  });

  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: [`/api/teams/${teamId}/payments/player/${playerId}`],
    enabled: !!teamId && !!playerId && user?.role === "coach",
  });

  // Calculate payment total
  const paymentTotal = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

  if (isLoadingPlayer) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Player Not Found</h1>
        <Link href="/">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-3 sm:py-8 sm:px-4 max-w-5xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col justify-between items-start mb-4 sm:mb-6">
        <div className="w-full">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">{player.name}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Status: <span className={player.active ? "text-green-600" : "text-red-600"}>
              {player.active ? "Active" : "Inactive"}
            </span>
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-8 w-full">
          <TabsTrigger value="details" className="text-xs sm:text-sm">
            <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs sm:text-sm">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Notes</span>
          </TabsTrigger>
          {user?.role === "coach" && (
            <TabsTrigger value="payments" className="text-xs sm:text-sm">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Payments</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Player Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Player Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 sm:space-y-4">
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-muted-foreground">Name</dt>
                    <dd className="text-base sm:text-lg">{player.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-muted-foreground">Team ID</dt>
                    <dd className="text-base sm:text-lg">{player.teamId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-base sm:text-lg">{player.active ? "Active" : "Inactive"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Parent Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 sm:space-y-4">
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-muted-foreground">Parent ID</dt>
                    <dd className="text-base sm:text-lg">{player.parentId}</dd>
                  </div>
                  {/* We'll need to fetch parent details in a future update */}
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-muted-foreground">Contact</dt>
                    <dd className="text-base sm:text-lg text-muted-foreground">Contact details will be added in future update</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-sm sm:text-base">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="text-xl sm:text-3xl font-bold">
                    {attendanceRecords?.length ? 
                      `${Math.round((attendanceRecords.filter(a => a.present).length / attendanceRecords.length) * 100)}%` : 
                      "N/A"}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-sm sm:text-base">Present</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="text-xl sm:text-3xl font-bold text-green-600">
                    {attendanceRecords?.filter(a => a.present).length || 0}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-sm sm:text-base">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="text-xl sm:text-3xl font-bold text-red-600">
                    {attendanceRecords?.filter(a => !a.present).length || 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Attendance History</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoadingAttendance ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : attendanceRecords?.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ${
                              record.present
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {record.present ? "Present" : "Absent"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">No attendance records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Practice Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl">Practice Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNotes ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : practiceNotes?.length ? (
                <div className="space-y-4 sm:space-y-6">
                  {practiceNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm sm:text-base">
                          {new Date(note.practiceDate).toLocaleDateString()}
                        </h3>
                      </div>
                      <p className="whitespace-pre-wrap text-xs sm:text-sm">{note.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">No practice notes found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab (Coach Only) */}
        {user?.role === "coach" && (
          <TabsContent value="payments">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card>
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-sm sm:text-base">Total Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="text-xl sm:text-3xl font-bold">
                      ${paymentTotal.toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-sm sm:text-base">Payment Count</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="text-xl sm:text-3xl font-bold">
                      {payments?.length || 0}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingPayments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : payments?.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                          <TableHead className="text-xs sm:text-sm">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{new Date(payment.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-xs sm:text-sm py-2 sm:py-4">${Number(payment.amount).toFixed(2)}</TableCell>
                            <TableCell className="text-xs sm:text-sm py-2 sm:py-4 truncate max-w-[150px] sm:max-w-none">{payment.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground text-sm">No payment records found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 