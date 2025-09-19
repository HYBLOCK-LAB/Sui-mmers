import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LessonProps {
  lessonNumber: number
  title: string
  description: string
  objectives: string[]
  tips?: string[]
}

export function Lesson({ lessonNumber, title, description, objectives = [], tips }: LessonProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
            {lessonNumber}
          </span>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <span className="mr-2">🎯</span> 학습 목표
          </h3>
          <ul className="space-y-1">
            {objectives.map((objective, index) => (
              <li key={index} className="text-gray-700 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {tips && tips.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">💡</span> 팁
            </h3>
            <ul className="space-y-1">
              {tips.map((tip, index) => (
                <li key={index} className="text-gray-700 text-sm">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            Move 언어는 Sui 블록체인의 스마트 컨트랙트 언어입니다.
            안전하고 효율적인 디지털 자산 관리를 위해 설계되었습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}