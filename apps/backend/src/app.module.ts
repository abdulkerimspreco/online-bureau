import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { JobSeekersModule } from './job-seekers/job-seekers.module';
import { EmployersModule } from './employers/employers.module';
import { CvModule } from './cv/cv.module';
import { TagsModule } from './tags/tags.module';
import { ContactRequestsModule } from './contact-requests/contact-requests.module';
import { SavedSearchesModule } from './saved-searches/saved-searches.module';
import { ShortlistModule } from './shortlist/shortlist.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PrismaModule,
    JobSeekersModule,
    EmployersModule,
    CvModule,
    TagsModule,
    ContactRequestsModule,
    SavedSearchesModule,
    ShortlistModule,
  ],
})
export class AppModule { }
