# Orbit

Предлагаю **финальную, детально продуманную архитектуру и структуру проекта** `Orbit`, полностью очищенную от конкретных частных решений.  

Это будет мощная, универсальная и минималистичная платформа автоматизации, полностью готовая к расширению для любых задач (включая, но не ограничиваясь, Grafana Stack).

---

# 🚀 Orbit Deploy Automation Platform (финальная архитектура)

**Цель:** Универсальная, максимально чистая и зрелая платформа автоматизации серверов.

**Основные принципы:**
- Типизированность и строгость (TypeScript)
- Простота расширения и разработки плейбуков
- Модульность и composability
- Параллельность и производительность
- Structured Logging и Observability
- Максимально простая декларативность
- Возможность сухого запуска (dry-run)

---

## 📂 Финальная структура папки `src`

Это максимально полный список файлов, который пошагово реализуем в следующем порядке:

```bash
src/
├── core/
│   ├── execution/
│   │   ├── executor.ts          # Параллельное и последовательное выполнение задач
│   │   ├── sshClient.ts         # Абстракция SSH-клиента
│   │   └── command.ts           # Абстракция команд и результатов
│   │
│   ├── inventory/
│   │   ├── inventory.ts         # Управление серверами и группами
│   │   ├── host.ts              # Класс представления сервера (Host)
│   │   └── group.ts             # Группировка серверов
│   │
│   ├── tasks/
│   │   ├── task.ts              # Общий интерфейс и базовый класс Task
│   │   ├── shellTask.ts         # Реализация задачи выполнения shell-команд
│   │   ├── copyTask.ts          # Задача копирования файлов на серверы
│   │   └── compositeTask.ts     # Составная задача из других задач
│   │
│   ├── playbooks/
│   │   ├── playbook.ts          # Общая абстракция плейбука
│   │   └── playbookRunner.ts    # Запуск плейбуков
│   │
│   ├── modules/
│   │   ├── module.ts            # Абстракция модуля (повторно используемая логика)
│   │   └── moduleRegistry.ts    # Реестр модулей и их загрузка
│   │
│   ├── templating/
│   │   ├── variables.ts         # Переменные и шаблоны
│   │   └── templateEngine.ts    # Движок шаблонизации
│   │
│   ├── logging/
│   │   ├── logger.ts            # Structured Logger с уровнями логирования
│   │   └── logFormatter.ts      # Форматирование и вывод логов
│   │
│   ├── errors/
│   │   ├── orbitError.ts        # Базовый класс исключений Orbit
│   │   └── retryPolicy.ts       # Механизм Retry при ошибках
│   │
│   └── config/
│       ├── orbitConfig.ts       # Глобальная конфигурация Orbit
│       └── configLoader.ts      # Загрузка конфигурации из файлов
│
├── cli/
│   ├── commands/
│   │   ├── deployCommand.ts     # Команда выполнения deploy
│   │   ├── inventoryCommand.ts  # Управление inventory через CLI
│   │   └── playbookCommand.ts   # Команда запуска плейбуков
│   │
│   ├── cli.ts                   # Главный входной файл CLI
│   └── cliUtils.ts              # Вспомогательные функции для CLI
│
├── types/
│   ├── common.ts                # Общие типы и утилиты
│   └── ssh.ts                   # Типы, специфичные для SSH
│
├── utils/
│   ├── fsUtils.ts               # Утилиты для работы с файловой системой
│   └── networkUtils.ts          # Утилиты для работы с сетью
│
└── index.ts                     # Главный модуль экспорта Orbit API
```

---

## 🧩 Подробное описание каждого модуля и файла

Ниже раскрыта краткая суть каждого файла:

### 🚦 `core/execution/`

- **executor.ts** – исполнитель задач, обеспечивающий параллельность и последовательность выполнения.
- **sshClient.ts** – прозрачная абстракция SSH-соединений.
- **command.ts** – представление команд и их результатов.

### 🌐 `core/inventory/`

- **inventory.ts** – управление всеми серверами и группами серверов.
- **host.ts** – описание сервера, его конфигурации и состояния.
- **group.ts** – группировка серверов для batch-операций.

### 📌 `core/tasks/`

- **task.ts** – универсальный интерфейс задачи.
- **shellTask.ts** – задача для выполнения команд на сервере.
- **copyTask.ts** – копирование файлов на сервер.
- **compositeTask.ts** – составная задача из нескольких задач.

### 🎯 `core/playbooks/`

- **playbook.ts** – декларативное описание задач.
- **playbookRunner.ts** – запуск и контроль выполнения плейбуков.

### 🧱 `core/modules/`

- **module.ts** – описание модулей (повторно используемые логические компоненты).
- **moduleRegistry.ts** – загрузка и регистрация модулей.

### 🎨 `core/templating/`

- **variables.ts** – управление переменными и их подстановками.
- **templateEngine.ts** – движок обработки шаблонов.

### 📋 `core/logging/`

- **logger.ts** – логирование с уровнями (trace, debug, info, warn, error).
- **logFormatter.ts** – форматирование и вывод логов (JSON, human-readable).

### 🚧 `core/errors/`

- **orbitError.ts** – общий базовый класс исключений Orbit.
- **retryPolicy.ts** – политики повторного выполнения при ошибках.

### ⚙️ `core/config/`

- **orbitConfig.ts** – центральная конфигурация Orbit.
- **configLoader.ts** – загрузка и валидация конфигураций из YAML/JSON.

### 💻 `cli/`

- **commands/** – реализация CLI-команд.
- **cli.ts** – основной интерфейс командной строки.
- **cliUtils.ts** – вспомогательные функции CLI.

### 📖 `types/`

- Типы и интерфейсы общего назначения и SSH-специфичные типы.

### 🔧 `utils/`

- Общие вспомогательные функции и утилиты работы с сетью и файловой системой.

---

## ✅ Пошаговый план реализации файлов:

Предлагаю последовательность запросов (по одному запросу — один файл или пара файлов, где логично):

1. `types/common.ts` и `types/ssh.ts`
2. `core/inventory/host.ts` и `core/inventory/group.ts`
3. `core/inventory/inventory.ts`
4. `core/execution/command.ts` и `core/execution/sshClient.ts`
5. `core/execution/executor.ts`
6. `core/tasks/task.ts`
7. `core/tasks/shellTask.ts`, `core/tasks/copyTask.ts`, `core/tasks/compositeTask.ts`
8. `core/playbooks/playbook.ts` и `core/playbooks/playbookRunner.ts`
9. `core/modules/module.ts` и `core/modules/moduleRegistry.ts`
10. `core/templating/variables.ts` и `core/templating/templateEngine.ts`
11. `core/logging/logger.ts` и `core/logging/logFormatter.ts`
12. `core/errors/orbitError.ts` и `core/errors/retryPolicy.ts`
13. `core/config/orbitConfig.ts` и `core/config/configLoader.ts`
14. `cli/cli.ts` и `cli/cliUtils.ts`
15. Реализация CLI-команд (`deployCommand.ts`, `inventoryCommand.ts`, `playbookCommand.ts`)
16. Главный `index.ts` и интеграция всех компонентов.

---

🎯 **Финал:**  
Подтверди предложенную структуру и последовательность, и можем начать **первый запрос** (`types/common.ts` и `types/ssh.ts`).